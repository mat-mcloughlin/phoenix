//[22:26] <MarcelGerber> So the API is Dialogs.showModalDialog(dlgClass, title, message, buttons, autoDismiss)
//[22:26] <MarcelGerber> dlgClass is one of the ones listed at https://github.com/adobe/brackets/blob/master/src/widgets/DefaultDialogs.js
//[22:27] <MarcelGerber> title and message are pretty self-explanatory, buttons and autoDismiss are optional
//[22:28] <MarcelGerber> buttons defaults to just an "OK" button, so if you need more than that, like Yes/No or Ok/Close, you'd need to pass that in, too
//[22:30] <MarcelGerber> For knowing when your dialog was closed, simply use .done(function () { ... })

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function (require, exports, module) {
    'use strict';

    var EditorManager = brackets.getModule("editor/EditorManager"),
        DocumentManager = brackets.getModule('document/DocumentManager'),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        DefaultDialogs  = brackets.getModule("widgets/DefaultDialogs"),
        Omnisharp = require('modules/omnisharp'),
        Helpers = require('modules/helpers'),
        FileUtils = brackets.getModule('file/FileUtils'),
        CommandManager = brackets.getModule('command/CommandManager'),
        Commands = brackets.getModule('command/Commands'),
        Strings = require('strings');

    var $input;

    function onClose(buttonId) {
        var renameTo = $input.val();

        if (buttonId === Strings.renameOk && renameTo !== undefined) {
            var data = Helpers.buildRequest();
            data.renameto = renameTo;

            Omnisharp.makeRequest('rename', data, function (err, data) {
                data.Changes.forEach(function (change) {
                    var unixPath = FileUtils.convertWindowsPathToUnixPath(change.FileName);
                    DocumentManager.getDocumentForPath(unixPath).done(function (document) {
                        document.setText(change.Buffer);
                    });
                });
            });
        }
    }

    function rename() {
        Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_SAVE_CLOSE,
            'Rename',
            '<input style="margin-bottom:-18px;" type="text" id="renameInput" />',
            [
                { className: 'primary', id: Strings.renameOk, text: 'Ok' },
                { className: 'left', id: Strings.renameCancel, text: 'Cancel' }
            ],
            true
        ).done(onClose);

        $input = $('#renameInput');
        var oldName = EditorManager.getCurrentFullEditor().getSelectedText();
        $input.val(oldName);
        $input.focus();
        $input.select();
        $input.keyup(function (event) {
            if (event.keyCode === 13) {
                Dialogs.cancelModalDialogIfOpen(
                    DefaultDialogs.DIALOG_ID_SAVE_CLOSE,
                    Strings.renameOk
                );
            }
        });
    }

    exports.rename = rename;
});
