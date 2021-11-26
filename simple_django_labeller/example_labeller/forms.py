from django import forms


class ImageUploadForm (forms.Form):
    # JC edit: multipe image upload
    file = forms.FileField(widget=forms.ClearableFileInput(attrs={'multiple':True}))