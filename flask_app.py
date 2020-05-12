# The MIT License (MIT)
#
# Copyright (c) 2015 University of East Anglia, Norwich, UK
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
#
# Developed by Geoffrey French in collaboration with Dr. M. Fisher and
# Dr. M. Mackiewicz.
import click

@click.command()
@click.option('--images_pat', type=str, default='', help='Image path pattern e.g. \'images/*.jpg\'')
@click.option('--labels_dir', type=click.Path(dir_okay=True, file_okay=False, writable=True))
@click.option('--slic', is_flag=True, default=False, help='Use SLIC segmentation to generate initial labels')
@click.option('--readonly', is_flag=True, default=False, help='Don\'t persist changes to disk')
@click.option('--enable_dextr', is_flag=True, default=False)
@click.option('--dextr_weights', type=click.Path())
def run_app(images_pat, labels_dir, slic, readonly, enable_dextr, dextr_weights):
    import os
    import glob
    from image_labelling_tool import labelling_tool, flask_labeller

    if enable_dextr or dextr_weights is not None:
        from dextr.model import DextrModel
        import torch

        device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

        if dextr_weights is not None:
            dextr_weights = os.path.expanduser(dextr_weights)
            dextr_model = torch.load(dextr_weights, map_location=device)
        else:
            dextr_model = DextrModel.pascalvoc_resunet101().to(device)

        dextr_model.eval()

        dextr_fn = lambda image, points: dextr_model.predict([image], points[None, :, ::-1])[0] >= 0.5
    else:
        dextr_fn = None

    colour_schemes = [
        dict(name='default', human_name='All'),
        dict(name='natural', human_name='Natural'),
        dict(name='artificial', human_name='Artifical')
    ]

    # Specify our 3 label classes.
    # `LabelClass` parameters are: symbolic name, human readable name for UI, and colours by colour scheme.
    # The user can choose between colour schemes, this is useful when there are lots of label classes,
    # making it difficult to choose a range of colours that are easily differentiable from one another.
    # In this case, the colour schemes are 'default', 'natural' and 'artifical'.
    # They given human readable names that are displayed in the UI in the `tools.colour_schemes` section
    # of the `config` dictionary below.
    label_classes = [
        labelling_tool.LabelClassGroup('Natural', [
            labelling_tool.LabelClass('tree', 'Trees', dict(default=[0, 255, 192], natural=[0, 255, 192],
                                                            artificial=[128, 128, 128])),
            labelling_tool.LabelClass('lake', 'Lake', dict(default=[0, 128, 255], natural=[0, 128, 255],
                                                           artificial=[128, 128, 128])),
        ]),
        labelling_tool.LabelClassGroup('Artificial', [
            labelling_tool.LabelClass('building', 'Buldings', dict(default=[255, 128, 0], natural=[128, 128, 128],
                                                                   artificial=[255, 128, 0])),
        ])]

    if images_pat.strip() == '':
        image_paths = glob.glob('images/*.jpg') + glob.glob('images/*.png')
    else:
        image_paths = glob.glob(images_pat)

    if slic:
        from matplotlib import pyplot as plt
        from skimage.segmentation import slic as slic_segment

        labelled_images = []
        for path in image_paths:
            print('Segmenting {0}'.format(path))
            img = plt.imread(path)
            # slic_labels = slic_segment(img, 1000, compactness=20.0)
            slic_labels = slic_segment(img, 1000, slic_zero=True) + 1

            print('Converting SLIC labels to vector labels...')
            labels = labelling_tool.ImageLabels.from_label_image(slic_labels)

            limg = labelling_tool.LabelledImageFile(path, labels)
            labelled_images.append(limg)

        print('Segmented {0} images'.format(len(labelled_images)))
    else:
        # Load in .JPG images from the 'images' directory.
        labelled_images = labelling_tool.PersistentLabelledImage.for_files(
            image_paths, labels_dir=labels_dir, readonly=readonly)
        print('Loaded {0} images'.format(len(labelled_images)))


    config = {
        'tools': {
            'imageSelector': True,
            'labelClassSelector': True,
            'drawPointLabel': False,
            'drawBoxLabel': True,
            'drawPolyLabel': True,
            'compositeLabel': False,
            'deleteLabel': True,
            'deleteConfig': {
                'typePermissions': {
                    'point': True,
                    'box': True,
                    'polygon': True,
                    'composite': True,
                    'group': True,
                }
            }
        }
    }

    flask_labeller.flask_labeller(label_classes, labelled_images, colour_schemes, config=config,
                                  dextr_fn=dextr_fn)


if __name__ == '__main__':
    run_app()