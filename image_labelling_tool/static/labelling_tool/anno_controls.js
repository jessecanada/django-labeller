/*
The MIT License (MIT)

Copyright (c) 2015 University of East Anglia, Norwich, UK

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Developed by Geoffrey French in collaboration with Dr. M. Fisher and
Dr. M. Mackiewicz.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/// <reference path="../jquery.d.ts" />
/// <reference path="./popup_menu.ts" />
var labelling_tool;
(function (labelling_tool) {
    var AnnotationControl = /** @class */ (function () {
        function AnnotationControl(ctrl_json, on_change) {
            this.on_change = on_change;
            this.identifier = ctrl_json.identifier;
            this.label = $("label[for='anno_ctrl_" + this.identifier + "']");
        }
        AnnotationControl.prototype.update_from_value = function (value, active) {
            if (active) {
                this.label.removeClass('text-muted');
            }
            else {
                this.label.addClass('text-muted');
            }
        };
        AnnotationControl.prototype.update_from_anno_data = function (anno_data, valid_selection) {
            if (anno_data !== undefined && anno_data !== null) {
                var value = anno_data[this.identifier];
                this.update_from_value(value, valid_selection);
            }
            else {
                this.update_from_value(undefined, valid_selection);
            }
        };
        AnnotationControl.from_json = function (ctrl_json, on_change) {
            if (ctrl_json.control === 'checkbox') {
                return new AnnotationCheckbox(ctrl_json, on_change);
            }
            else if (ctrl_json.control === 'radio') {
                return new AnnotationRadio(ctrl_json, on_change);
            }
            else if (ctrl_json.control === 'popup_menu') {
                return new AnnotationPopupMenu(ctrl_json, on_change);
            }
            else if (ctrl_json.control === 'text') {
                return new AnnotationText(ctrl_json, on_change);
            }
            else {
                throw "Unknown control type " + ctrl_json.control;
            }
        };
        return AnnotationControl;
    }());
    labelling_tool.AnnotationControl = AnnotationControl;
    var AnnotationCheckbox = /** @class */ (function (_super) {
        __extends(AnnotationCheckbox, _super);
        function AnnotationCheckbox(ctrl_json, on_change) {
            var _this = _super.call(this, ctrl_json, on_change) || this;
            _this.ctrl_json = ctrl_json;
            var self = _this;
            _this.checkbox = $('#anno_ctrl_' + _this.identifier);
            _this.checkbox.change(function (event, ui) {
                self.on_change(self.identifier, event.target.checked);
            });
            return _this;
        }
        AnnotationCheckbox.prototype.update_from_value = function (value, active) {
            _super.prototype.update_from_value.call(this, value, active);
            if (value !== undefined) {
                this.checkbox.prop("checked", value);
                this.checkbox.prop("indeterminate", false);
                return;
            }
            else {
                this.checkbox.prop("indeterminate", true);
            }
            if (active) {
                this.checkbox.removeAttr('disabled');
            }
            else {
                this.checkbox.attr('disabled', 'disabled');
            }
        };
        return AnnotationCheckbox;
    }(AnnotationControl));
    labelling_tool.AnnotationCheckbox = AnnotationCheckbox;
    var AnnotationRadio = /** @class */ (function (_super) {
        __extends(AnnotationRadio, _super);
        function AnnotationRadio(ctrl_json, on_change) {
            var _this = _super.call(this, ctrl_json, on_change) || this;
            _this.ctrl_json = ctrl_json;
            _this.radio_buttons = [];
            var self = _this;
            for (var i = 0; i < ctrl_json.choices.length; i++) {
                var choice_json = ctrl_json.choices[i];
                var btn = $('#anno_ctrl_' + _this.identifier + '_' + choice_json.value);
                btn.change(function (event, ui) {
                    if (event.target.checked) {
                        self.on_change(self.identifier, event.target.value);
                    }
                });
                _this.radio_buttons.push(btn);
            }
            return _this;
        }
        AnnotationRadio.prototype.update_from_value = function (value, active) {
            _super.prototype.update_from_value.call(this, value, active);
            for (var i = 0; i < this.radio_buttons.length; i++) {
                if (this.ctrl_json.choices[i].value === value) {
                    this.radio_buttons[i].closest('label.btn').addClass('active');
                }
                else {
                    this.radio_buttons[i].closest('label.btn').removeClass('active');
                }
                if (active) {
                    this.radio_buttons[i].removeAttr('disabled');
                }
                else {
                    this.radio_buttons[i].attr('disabled', 'disabled');
                }
            }
        };
        return AnnotationRadio;
    }(AnnotationControl));
    labelling_tool.AnnotationRadio = AnnotationRadio;
    var AnnotationPopupMenu = /** @class */ (function (_super) {
        __extends(AnnotationPopupMenu, _super);
        function AnnotationPopupMenu(ctrl_json, on_change) {
            var _this = _super.call(this, ctrl_json, on_change) || this;
            _this.ctrl_json = ctrl_json;
            var self = _this;
            self.menu_button = $('#anno_ctrl_' + _this.identifier);
            _this.menu = new popup_menu.PopupMenu(self.menu_button, $('#anno_ctrl_contents_' + _this.identifier), { placement: 'bottom' });
            self.menu_button.on('change', function (el, event) {
                self.on_change(self.identifier, event.value);
            });
            return _this;
        }
        AnnotationPopupMenu.prototype.update_from_value = function (value, active) {
            _super.prototype.update_from_value.call(this, value, active);
            this.menu.setChoice(value);
            if (active) {
                this.menu_button.removeAttr('disabled');
            }
            else {
                this.menu_button.attr('disabled', 'disabled');
            }
        };
        return AnnotationPopupMenu;
    }(AnnotationControl));
    labelling_tool.AnnotationPopupMenu = AnnotationPopupMenu;
    var AnnotationText = /** @class */ (function (_super) {
        __extends(AnnotationText, _super);
        function AnnotationText(ctrl_json, on_change) {
            var _this = _super.call(this, ctrl_json, on_change) || this;
            _this.ctrl_json = ctrl_json;
            var self = _this;
            _this.text_entry = $('#anno_ctrl_' + _this.identifier);
            _this.text_entry.on('input', function (event, ui) {
                self.on_change(self.identifier, event.target.value);
            });
            return _this;
        }
        AnnotationText.prototype.update_from_value = function (value, active) {
            _super.prototype.update_from_value.call(this, value, active);
            this.text_entry.val(value);
            if (active) {
                this.text_entry.removeAttr('disabled');
            }
            else {
                this.text_entry.attr('disabled', 'disabled');
            }
        };
        return AnnotationText;
    }(AnnotationControl));
    labelling_tool.AnnotationText = AnnotationText;
    var AnnotationVisFilter = /** @class */ (function () {
        function AnnotationVisFilter(ctrl_json, on_change) {
            var self = this;
            this.ctrl_json = ctrl_json;
            this.on_change = on_change;
            this.identifier = ctrl_json.identifier;
            this.select = $('#vis_filter_anno_ctrl_' + this.identifier);
            this.select.on('change', function (el, event) {
                self.on_change(self.identifier, this.value);
            });
        }
        return AnnotationVisFilter;
    }());
    labelling_tool.AnnotationVisFilter = AnnotationVisFilter;
})(labelling_tool || (labelling_tool = {}));
