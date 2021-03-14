(self["webpackChunk_jupyterlab_examples_server_extension"] = self["webpackChunk_jupyterlab_examples_server_extension"] || []).push([["lib_index_js"],{

/***/ "./lib/handler.js":
/*!************************!*\
  !*** ./lib/handler.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "requestAPI": () => (/* binding */ requestAPI),
/* harmony export */   "VariableInspectionHandler": () => (/* binding */ VariableInspectionHandler),
/* harmony export */   "DummyHandler": () => (/* binding */ DummyHandler)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @lumino/signaling */ "webpack/sharing/consume/default/@lumino/signaling");
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_lumino_signaling__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _lumino_datagrid__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @lumino/datagrid */ "webpack/sharing/consume/default/@lumino/datagrid/@lumino/datagrid");
/* harmony import */ var _lumino_datagrid__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_lumino_datagrid__WEBPACK_IMPORTED_MODULE_3__);



// import {
//   JSONModel, DataModel
// } from "@lumino/datagrid";
/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
async function requestAPI(endPoint = '', init = {}) {
    // Make request to Jupyter API
    const settings = _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeSettings();
    const requestUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(settings.baseUrl, 'jlab-ext-example', endPoint);
    let response;
    try {
        response = await _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeRequest(requestUrl, init, settings);
    }
    catch (error) {
        throw new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.NetworkError(error);
    }
    const data = await response.json();
    if (!response.ok) {
        throw new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.ResponseError(response, data.message);
    }
    return data;
}

/**
* An object that handles code inspection.
*/
class VariableInspectionHandler {
    constructor(options) {
        this._disposed = new _lumino_signaling__WEBPACK_IMPORTED_MODULE_2__.Signal(this);
        this._inspected = new _lumino_signaling__WEBPACK_IMPORTED_MODULE_2__.Signal(this);
        this._isDisposed = false;
        /*
         * Handle query response. Emit new signal containing the IVariableInspector.IInspectorUpdate object.
         * (TODO: query resp. could be forwarded to panel directly)
         */
        this._handleQueryResponse = (response, reply) => {
            let msgType = response.header.msg_type;
            switch (msgType) {
                case "execute_result":
                    let payload = response.content;
                    let content = payload.data["text/plain"];
                    if (content.slice(0, 1) == "'" || content.slice(0, 1) == "\"") {
                        content = content.slice(1, -1);
                        content = content.replace(/\\"/g, "\"").replace(/\\'/g, "\'");
                    }
                    let update;
                    update = JSON.parse(content);
                    let title;
                    title = {
                        contextName: "",
                        kernelName: this._connector.kernelName || "",
                        reply: reply
                    };
                    this._inspected.emit({ title: title, payload: update });
                    break;
                case "display_data":
                    let payload_display = response.content;
                    let content_display = payload_display.data["text/plain"];
                    if (content_display.slice(0, 1) == "'" || content_display.slice(0, 1) == "\"") {
                        content_display = content_display.slice(1, -1);
                        content_display = content_display.replace(/\\"/g, "\"").replace(/\\'/g, "\'");
                    }
                    let update_display;
                    update_display = JSON.parse(content_display);
                    let title_display;
                    title_display = {
                        contextName: "",
                        kernelName: this._connector.kernelName || ""
                    };
                    this._inspected.emit({ title: title_display, payload: update_display });
                    break;
                default:
                    break;
            }
        };
        /*
         * Invokes a inspection if the signal emitted from specified session is an 'execute_input' msg.
         */
        this._queryCall = (sess, msg) => {
            let msgType = msg.header.msg_type;
            switch (msgType) {
                case 'execute_input':
                    let code = msg.content.code;
                    if (!(code == this._queryCommand) && !(code == this._matrixQueryCommand) && !(code.startsWith(this._widgetQueryCommand))) {
                        this.performInspection();
                    }
                    break;
                default:
                    break;
            }
        };
        this._id = options.id;
        this._connector = options.connector;
        this._rendermime = options.rendermime;
        this._queryCommand = options.queryCommand;
        this._matrixQueryCommand = options.matrixQueryCommand;
        this._widgetQueryCommand = options.widgetQueryCommand;
        this._deleteCommand = options.deleteCommand;
        this._initScript = options.initScript;
        this._ready = this._connector.ready.then(() => {
            this._initOnKernel().then((msg) => {
                // this._connector.iopubMessage.connect( this._queryCall );
                return;
            });
        });
        this._connector.kernelRestarted.connect((sender, kernelReady) => {
            const title = {
                contextName: "<b>Restarting kernel...</b> "
            };
            this._inspected.emit({ title: title, payload: [] });
            this._ready = kernelReady.then(() => {
                this._initOnKernel().then((msg) => {
                    // this._connector.iopubMessage.connect( this._queryCall );
                    this.performInspection();
                });
            });
        });
    }
    get id() {
        return this._id;
    }
    get rendermime() {
        return this._rendermime;
    }
    /**
     * A signal emitted when the handler is disposed.
     */
    get disposed() {
        return this._disposed;
    }
    get isDisposed() {
        return this._isDisposed;
    }
    get ready() {
        return this._ready;
    }
    /**
     * A signal emitted when an inspector value is generated.
     */
    get inspected() {
        return this._inspected;
    }
    /**
     * Performs an inspection by sending an execute request with the query command to the kernel.
     */
    performInspection(reply) {
        let content = {
            code: this._queryCommand,
            stop_on_error: false,
            store_history: false
        };
        this._connector.fetch(content, this._handleQueryResponse, reply);
    }
    /**
     * Performs an inspection of a Jupyter Widget
     */
    performWidgetInspection(varName) {
        const request = {
            code: this._widgetQueryCommand + "(" + varName + ")",
            stop_on_error: false,
            store_history: false
        };
        return this._connector.execute(request);
    }
    /**
     * Performs an inspection of the specified matrix.
     */
    performMatrixInspection(varName, maxRows = 100000) {
        let request = {
            code: this._matrixQueryCommand + "(" + varName + ", " + maxRows + ")",
            stop_on_error: false,
            store_history: false
        };
        let con = this._connector;
        return new Promise(function (resolve, reject) {
            con.fetch(request, (response) => {
                let msgType = response.header.msg_type;
                switch (msgType) {
                    case "execute_result":
                        let payload = response.content;
                        let content = payload.data["text/plain"];
                        let content_clean = content.replace(/^'|'$/g, "");
                        content_clean = content_clean.replace(/\\"/g, '"');
                        content_clean = content_clean.replace(/\\'/g, "\\\\'");
                        let modelOptions = JSON.parse(content_clean);
                        let jsonModel = new _lumino_datagrid__WEBPACK_IMPORTED_MODULE_3__.JSONModel(modelOptions);
                        resolve(jsonModel);
                        break;
                    case "error":
                        console.log(response);
                        reject("Kernel error on 'matrixQuery' call!");
                        break;
                    default:
                        break;
                }
            });
        });
    }
    /**
     * Send a kernel request to delete a variable from the global environment
     */
    performDelete(varName) {
        let content = {
            code: this._deleteCommand + "('" + varName + "')",
            stop_on_error: false,
            store_history: false,
        };
        this._connector.fetch(content, this._handleQueryResponse);
    }
    /*
     * Disposes the kernel connector.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        this._disposed.emit(void 0);
        _lumino_signaling__WEBPACK_IMPORTED_MODULE_2__.Signal.clearData(this);
    }
    /**
     * Initializes the kernel by running the set up script located at _initScriptPath.
     */
    _initOnKernel() {
        let content = {
            code: this._initScript,
            stop_on_error: false,
            silent: true,
        };
        return this._connector.fetch(content, (() => { }));
    }
}
class DummyHandler {
    constructor(connector) {
        this._isDisposed = false;
        this._disposed = new _lumino_signaling__WEBPACK_IMPORTED_MODULE_2__.Signal(this);
        this._inspected = new _lumino_signaling__WEBPACK_IMPORTED_MODULE_2__.Signal(this);
        this._rendermime = null;
        this._connector = connector;
    }
    get disposed() {
        return this._disposed;
    }
    get isDisposed() {
        return this._isDisposed;
    }
    get inspected() {
        return this._inspected;
    }
    get rendermime() {
        return this._rendermime;
    }
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        this._disposed.emit(void 0);
        _lumino_signaling__WEBPACK_IMPORTED_MODULE_2__.Signal.clearData(this);
    }
    performInspection() {
        let title;
        title = {
            contextName: ". <b>Language currently not supported.</b> ",
            kernelName: this._connector.kernelName || ""
        };
        this._inspected.emit({ title: title, payload: [] });
    }
    performMatrixInspection(varName, maxRows) {
        return new Promise(function (resolve, reject) { reject("Cannot inspect matrices w/ the DummyHandler!"); });
    }
    performWidgetInspection(varName) {
        const request = {
            code: "",
            stop_on_error: false,
            store_history: false
        };
        return this._connector.execute(request);
    }
    performDelete(varName) { }
}


/***/ }),

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/application */ "webpack/sharing/consume/default/@jupyterlab/application");
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _jupyterlab_launcher__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlab/launcher */ "webpack/sharing/consume/default/@jupyterlab/launcher");
/* harmony import */ var _jupyterlab_launcher__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_launcher__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @jupyterlab/docmanager */ "webpack/sharing/consume/default/@jupyterlab/docmanager");
/* harmony import */ var _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _variableinspector__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./variableinspector */ "./lib/variableinspector.js");
/* harmony import */ var _manager__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./manager */ "./lib/manager.js");
/* harmony import */ var _handler__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./handler */ "./lib/handler.js");
/* harmony import */ var _kernelconnector__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./kernelconnector */ "./lib/kernelconnector.js");
/* harmony import */ var _inspectorscripts__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./inspectorscripts */ "./lib/inspectorscripts.js");





// import {
//   IConsoleTracker
// } from '@jupyterlab/console';







// import { ModelCardPanel } from './panel';
/**
 * The command IDs used by the server extension plugin.
 */
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.get = 'server:get-file';
    CommandIDs.openClassic = 'jupyterlab-classic:open';
    CommandIDs.open = "autodoc-panel:open";
})(CommandIDs || (CommandIDs = {}));
/**
 * A service providing variable introspection.
 */
const variableinspector = {
    id: "jupyterlab-extension:autodoc-panel",
    requires: [_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.ICommandPalette, _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILayoutRestorer, _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILabShell],
    provides: _manager__WEBPACK_IMPORTED_MODULE_7__.IVariableInspectorManager,
    autoStart: true,
    activate: (app, palette, restorer, labShell) => {
        const manager = new _manager__WEBPACK_IMPORTED_MODULE_7__.VariableInspectorManager();
        const category = "Autodoc Panel";
        const command = CommandIDs.open;
        const label = "Open Autodoc Panel";
        const namespace = "autodoc-panel";
        const tracker = new _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.WidgetTracker({ namespace });
        /**
         * Create and track a new inspector.
         */
        function newPanel() {
            const panel = new _variableinspector__WEBPACK_IMPORTED_MODULE_8__.VariableInspectorPanel();
            panel.id = "jp-autodoc-panel";
            panel.title.label = "Autodoc Panel";
            panel.title.closable = true;
            panel.disposed.connect(() => {
                if (manager.panel === panel) {
                    manager.panel = null;
                }
            });
            //Track the inspector panel
            tracker.add(panel);
            return panel;
        }
        // Enable state restoration
        restorer.restore(tracker, {
            command,
            args: () => null,
            name: () => "autodoc-panel"
        });
        // Add command to palette
        app.commands.addCommand(command, {
            label,
            execute: () => {
                if (!manager.panel || manager.panel.isDisposed) {
                    manager.panel = newPanel();
                }
                if (!manager.panel.isAttached) {
                    labShell.add(manager.panel, 'main');
                }
                if (manager.source) {
                    manager.source.performInspection();
                }
                labShell.activateById(manager.panel.id);
            }
        });
        palette.addItem({ command, category });
        return manager;
    }
};
/**
 * A notebook widget extension that adds a jupyterlab classic button to the toolbar.
 */
class ClassicButton {
    /**
     * Instantiate a new ClassicButton.
     * @param commands The command registry.
     */
    constructor(commands) {
        // this._commands = commands;
    }
    /**
     * Create a new extension object.
     */
    createNew(panel) {
        const button = new _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.ToolbarButton({
            tooltip: 'Run AutoDoc in the backend',
            icon: _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_6__.extensionIcon,
            onClick: async () => {
                const dataToSend = { command: "run", path: panel["context"].path };
                try {
                    const reply = await (0,_handler__WEBPACK_IMPORTED_MODULE_9__.requestAPI)('hello', {
                        body: JSON.stringify(dataToSend),
                        method: 'POST'
                    });
                    console.log(reply);
                }
                catch (reason) {
                    console.error(`Error on POST /jlab-ext-example/hello ${dataToSend}.\n${reason}`);
                }
            }
        });
        panel.toolbar.insertAfter('cellType', 'jupyterlabClassic', button);
        return button;
    }
}
/**
 * Initialization data for the server-extension-example extension.
 */
const extension = {
    id: 'server-extension-example',
    autoStart: true,
    optional: [_jupyterlab_launcher__WEBPACK_IMPORTED_MODULE_3__.ILauncher],
    requires: [_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILabShell, _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_4__.IDocumentManager, _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_5__.INotebookTracker, _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.ICommandPalette, _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILayoutRestorer],
    activate: async (app, panel, labShell, docManager, palette, restorer, launcher) => {
        console.log('JupyterLab extension server-extension-example is activated!');
        // Add the toolbar button to the notebook toolbar
        const { commands, docRegistry, shell } = app;
        const classicButton = new ClassicButton(commands);
        docRegistry.addWidgetExtension('Notebook', classicButton);
        // let widget: ModelCardPanel;
        // async function createPanel(): Promise<ModelCardPanel> {
        //   if (!widget) {
        //     widget = new ModelCardPanel(app, docManager);
        //   }
        //   if (!tracker.has(widget)) {
        //     tracker.add(widget);
        //   }
        //   if (!widget.isAttached) {
        //     app.shell.add(widget, 'main');
        //     app.shell.activateById(widget.id);
        //     app.docRegistry.addWidgetExtension('Notebook', widget);
        //   }
        //   // Refresh the content
        //   widget.update();
        //   return widget;
        // }
        // const command = CommandIDs.open;
        // app.commands.addCommand(command, {
        //   label: 'Model Card',
        //   caption: 'Generate Model Card',
        //   isVisible: () => false,
        //   execute: createPanel
        // });
        // palette.addItem({command , category: 'Model Card' });
        // const tracker = new WidgetTracker<ModelCardPanel>({
        //   namespace: 'model-card'
        // });
        // restorer.restore(tracker, {
        //   command: command,
        //   name: () => 'model-card'
        // });
        // const { commands, shell } = app;
        // const command = CommandIDs.get;
        // const category = 'Extension Examples';
        // commands.addCommand(command, {
        //   label: 'Get Server Content in a IFrame Widget',
        //   caption: 'Get Server Content in a IFrame Widget',
        //   execute: () => {
        //     const widget = new IFrameWidget();
        //     shell.add(widget, 'main');
        //   }
        // });
        // palette.addItem({ command, category: category });
        // if (launcher) {
        //   // Add launcher
        //   launcher.add({
        //     command: command,
        //     category: category
        //   });
        // }
    }
};
/**
 * An extension that registers notebooks for variable inspection.
 */
const notebooks = {
    id: "jupyterlab-extension:autodoc-panel:notebooks",
    requires: [_manager__WEBPACK_IMPORTED_MODULE_7__.IVariableInspectorManager, _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_5__.INotebookTracker, _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILabShell],
    autoStart: true,
    activate: (app, manager, notebooks, labShell) => {
        const handlers = {};
        /**
          * Subscribes to the creation of new notebooks. If a new notebook is created, build a new handler for the notebook.
          * Adds a promise for a instanced handler to the 'handlers' collection.
          */
        notebooks.widgetAdded.connect((sender, nbPanel) => {
            //A promise that resolves after the initialization of the handler is done.
            handlers[nbPanel.id] = new Promise(function (resolve, reject) {
                const session = nbPanel.sessionContext;
                const connector = new _kernelconnector__WEBPACK_IMPORTED_MODULE_10__.KernelConnector({ session });
                const rendermime = nbPanel.content.rendermime;
                let scripts;
                scripts = connector.ready.then(() => {
                    return connector.kernelLanguage.then(lang => {
                        return _inspectorscripts__WEBPACK_IMPORTED_MODULE_11__.Languages.getScript(lang);
                    });
                });
                scripts.then((result) => {
                    let initScript = result.initScript;
                    let queryCommand = result.queryCommand;
                    let matrixQueryCommand = result.matrixQueryCommand;
                    let widgetQueryCommand = result.widgetQueryCommand;
                    let deleteCommand = result.deleteCommand;
                    const options = {
                        queryCommand: queryCommand,
                        matrixQueryCommand: matrixQueryCommand,
                        widgetQueryCommand,
                        deleteCommand: deleteCommand,
                        connector: connector,
                        rendermime,
                        initScript: initScript,
                        id: session.path //Using the sessions path as an identifier for now.
                    };
                    const handler = new _handler__WEBPACK_IMPORTED_MODULE_9__.VariableInspectionHandler(options);
                    manager.addHandler(handler);
                    nbPanel.disposed.connect(() => {
                        delete handlers[nbPanel.id];
                        handler.dispose();
                    });
                    handler.ready.then(() => {
                        resolve(handler);
                    });
                });
                //Otherwise log error message.
                scripts.catch((result) => {
                    reject(result);
                });
            });
        });
        // current cell change
        notebooks.activeCellChanged.connect(async (sender, args) => {
            // console.log(notebooks.currentWidget.content.activeCellIndex);
            let curCellIdx = notebooks.currentWidget.content.activeCellIndex;
            const dataToSend = { command: "fetch", path: notebooks.currentWidget.context.path, cell: curCellIdx };
            console.log("fetching data from backend");
            try {
                const reply = await (0,_handler__WEBPACK_IMPORTED_MODULE_9__.requestAPI)('hello', {
                    body: JSON.stringify(dataToSend),
                    method: 'POST'
                });
                // console.log(reply);
                let future = handlers[notebooks.currentWidget.id];
                future.then((source) => {
                    if (source) {
                        manager.source = source;
                        console.log("start inspecting...");
                        manager.source.performInspection(reply);
                    }
                });
            }
            catch (reason) {
                console.error(`Error on POST /jlab-ext-example/hello ${dataToSend}.\n${reason}`);
            }
            console.log(curCellIdx);
        });
        app.contextMenu.addItem({
            command: CommandIDs.open,
            selector: ".jp-Notebook"
        });
    }
};
/**
* Export the plugins as default.
*/
const plugins = [variableinspector, extension, notebooks];
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugins);
class IFrameWidget extends _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.IFrame {
    constructor() {
        super();
        const baseUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2__.PageConfig.getBaseUrl();
        this.url = baseUrl + 'jlab-ext-example/public/index.html';
        this.id = 'doc-example';
        this.title.label = 'Server Doc';
        this.title.closable = true;
        this.node.style.overflowY = 'auto';
    }
}


/***/ }),

/***/ "./lib/inspectorscripts.js":
/*!*********************************!*\
  !*** ./lib/inspectorscripts.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Languages": () => (/* binding */ Languages)
/* harmony export */ });
class Languages {
    static getScript(lang) {
        return new Promise(function (resolve, reject) {
            if (lang in Languages.scripts) {
                resolve(Languages.scripts[lang]);
            }
            else {
                reject("Language " + lang + " not supported yet!");
            }
        });
    }
}
/**
 * Init and query script for supported languages.
 */
Languages.py_script = `import json
import sys
import copy
from IPython import get_ipython
from IPython.core.magics.namespace import NamespaceMagics


_jupyterlab_variableinspector_nms = NamespaceMagics()
_jupyterlab_variableinspector_Jupyter = get_ipython()
_jupyterlab_variableinspector_nms.shell = _jupyterlab_variableinspector_Jupyter.kernel.shell

__np = None
__pd = None
__pyspark = None
__tf = None
__K = None
__ipywidgets = None
past_vars, new_vars = [], []


def _check_imported():
    global __np, __pd, __pyspark, __tf, __K, __ipywidgets

    if 'numpy' in sys.modules:
        # don't really need the try
        import numpy as __np

    if 'pandas' in sys.modules:
        import pandas as __pd

    if 'pyspark' in sys.modules:
        import pyspark as __pyspark

    if 'tensorflow' in sys.modules or 'keras' in sys.modules:
        import tensorflow as __tf

        try:
            import keras.backend as __K
        except ImportError:
            try:
                import tensorflow.keras.backend as __K
            except ImportError:
                __K = None

    if 'ipywidgets' in sys.modules:
        import ipywidgets as __ipywidgets


def _jupyterlab_variableinspector_getsizeof(x):
    if type(x).__name__ in ['ndarray', 'Series']:
        return x.nbytes
    elif __pyspark and isinstance(x, __pyspark.sql.DataFrame):
        return "?"
    elif __tf and isinstance(x, __tf.Variable):
        return "?"
    elif __pd and type(x).__name__ == 'DataFrame':
        return x.memory_usage().sum()
    else:
        return sys.getsizeof(x)


def _jupyterlab_variableinspector_getshapeof(x):
    if __pd and isinstance(x, __pd.DataFrame):
        return "%d rows x %d cols" % x.shape
    if __pd and isinstance(x, __pd.Series):
        return "%d rows" % x.shape
    if __np and isinstance(x, __np.ndarray):
        shape = " x ".join([str(i) for i in x.shape])
        return "%s" % shape
    if __pyspark and isinstance(x, __pyspark.sql.DataFrame):
        return "? rows x %d cols" % len(x.columns)
    if __tf and isinstance(x, __tf.Variable):
        shape = " x ".join([str(int(i)) for i in x.shape])
        return "%s" % shape
    if __tf and isinstance(x, __tf.Tensor):
        shape = " x ".join([str(int(i)) for i in x.shape])
        return "%s" % shape
    if isinstance(x, list):
        return "%s" % len(x)
    if isinstance(x, dict):
        return "%s keys" % len(x)
    return None


def _jupyterlab_variableinspector_getcontentof(x):
    # returns content in a friendly way for python variables
    # pandas and numpy
    if __pd and isinstance(x, __pd.DataFrame):
        colnames = ', '.join(x.columns.map(str))
        content = "Columns: %s" % colnames
    elif __pd and isinstance(x, __pd.Series):
        content = str(x.values).replace(" ", ", ")[1:-1]
        content = content.replace("\\n", "")
    elif __np and isinstance(x, __np.ndarray):
        content = x.__repr__()
    else:
        content = str(x)

    if len(content) > 150:
        return content[:150] + " ..."
    else:
        return content


def _jupyterlab_variableinspector_is_matrix(x):
    # True if type(x).__name__ in ["DataFrame", "ndarray", "Series"] else False
    if __pd and isinstance(x, __pd.DataFrame):
        return True
    if __pd and isinstance(x, __pd.Series):
        return True
    if __np and isinstance(x, __np.ndarray) and len(x.shape) <= 2:
        return True
    if __pyspark and isinstance(x, __pyspark.sql.DataFrame):
        return True
    if __tf and isinstance(x, __tf.Variable) and len(x.shape) <= 2:
        return True
    if __tf and isinstance(x, __tf.Tensor) and len(x.shape) <= 2:
        return True
    if isinstance(x, list):
        return True
    return False


def _jupyterlab_variableinspector_is_widget(x):
    return __ipywidgets and issubclass(x, __ipywidgets.DOMWidget)


def _jupyterlab_variableinspector_dict_list():
    _check_imported()
    def keep_cond(v):
        if v in ["new_vars", "past_vars"]:
            return False
        try:
            obj = eval(v)
            if isinstance(obj, str):
                return True
            if __tf and isinstance(obj, __tf.Variable):
                return True
            if __pd and __pd is not None and (
                isinstance(obj, __pd.core.frame.DataFrame)
                or isinstance(obj, __pd.core.series.Series)):
                return True
            if str(obj)[0] == "<":
                return False
            if  v in ['__np', '__pd', '__pyspark', '__tf', '__K', '__ipywidgets']:
                return obj is not None
            if str(obj).startswith("_Feature"):
                # removes tf/keras objects
                return False
            return True
        except:
            return False
    values = _jupyterlab_variableinspector_nms.who_ls()

    def column_types(v):
        if __pd and __pd is not None and isinstance(v, __pd.core.frame.DataFrame):
            col = list(v.columns.map(type))
            return ', column_types: ' + str(col)
        return ''

    vardic = [
        {
            'varName': _v,
            'varType': str(type(eval(_v)).__name__) + column_types(eval(_v)), 
            'varSize': str(_jupyterlab_variableinspector_getsizeof(eval(_v))), 
            'varShape': str(_jupyterlab_variableinspector_getshapeof(eval(_v))) if _jupyterlab_variableinspector_getshapeof(eval(_v)) else '', 
            'varContent': str(_jupyterlab_variableinspector_getcontentof(eval(_v))), 
            'isMatrix': _jupyterlab_variableinspector_is_matrix(eval(_v)),
            'isWidget': _jupyterlab_variableinspector_is_widget(type(eval(_v)))
        }
        for _v in values if keep_cond(_v)
    ]
    global past_vars, new_vars
    past_vars = new_vars
    new_vars = [(_v, copy.deepcopy(eval(_v))) for _v in values if keep_cond(_v)]
    return json.dumps([past_vars, new_vars], ensure_ascii=False)
    # return json.dumps(vardic, ensure_ascii=False)


def _jupyterlab_variableinspector_getmatrixcontent(x, max_rows=10000):
    # to do: add something to handle this in the future
    threshold = max_rows

    if __pd and __pyspark and isinstance(x, __pyspark.sql.DataFrame):
        df = x.limit(threshold).toPandas()
        return _jupyterlab_variableinspector_getmatrixcontent(df.copy())
    elif __np and __pd and type(x).__name__ == "DataFrame":
        if threshold is not None:
            x = x.head(threshold)
        x.columns = x.columns.map(str)
        return x.to_json(orient="table", default_handler=_jupyterlab_variableinspector_default, force_ascii=False)
    elif __np and __pd and type(x).__name__ == "Series":
        if threshold is not None:
            x = x.head(threshold)
        return x.to_json(orient="table", default_handler=_jupyterlab_variableinspector_default, force_ascii=False)
    elif __np and __pd and type(x).__name__ == "ndarray":
        df = __pd.DataFrame(x)
        return _jupyterlab_variableinspector_getmatrixcontent(df)
    elif __tf and (isinstance(x, __tf.Variable) or isinstance(x, __tf.Tensor)):
        df = __K.get_value(x)
        return _jupyterlab_variableinspector_getmatrixcontent(df)
    elif isinstance(x, list):
        s = __pd.Series(x)
        return _jupyterlab_variableinspector_getmatrixcontent(s)


def _jupyterlab_variableinspector_displaywidget(widget):
    display(widget)


def _jupyterlab_variableinspector_default(o):
    if isinstance(o, __np.number): return int(o)  
    raise TypeError


def _jupyterlab_variableinspector_deletevariable(x):
    exec("del %s" % x, globals())
`;
Languages.r_script = `library(repr)

.ls.objects = function (pos = 1, pattern, order.by, decreasing = FALSE, head = FALSE, 
    n = 5) 
{
    napply <- function(names, fn) sapply(names, function(x) fn(get(x, 
        pos = pos)))
    names <- ls(pos = pos, pattern = pattern)
    if (length(names) == 0) {
        return(jsonlite::toJSON(data.frame()))
    }
    obj.class <- napply(names, function(x) as.character(class(x))[1])
    obj.mode <- napply(names, mode)
    obj.type <- ifelse(is.na(obj.class), obj.mode, obj.class)
    obj.size <- napply(names, object.size)
    obj.dim <- t(napply(names, function(x) as.numeric(dim(x))[1:2]))
    obj.content <- rep("NA", length(names))
    has_no_dim <- is.na(obj.dim)[1:length(names)]                        
    obj.dim[has_no_dim, 1] <- napply(names, length)[has_no_dim]
    vec <- (obj.type != "function")
    obj.content[vec] <- napply(names[vec], function(x) toString(x, width = 154)[1])
                      
    obj.rownames <- napply(names, rownames)
    has_rownames <- obj.rownames != "NULL"
    obj.rownames <- sapply(obj.rownames[has_rownames], function(x) paste(x,
        collapse=", "))
    obj.rownames.short <- sapply(obj.rownames, function(x) paste(substr(x, 1, 150), "...."))
    obj.rownames <- ifelse(nchar(obj.rownames) > 154, obj.rownames.short, obj.rownames)
    obj.rownames <- sapply(obj.rownames, function(x) paste("Row names: ",x))
    obj.content[has_rownames] <- obj.rownames
                               
                               
    obj.colnames <- napply(names, colnames)
    has_colnames <- obj.colnames != "NULL"
    obj.colnames <- sapply(obj.colnames[has_colnames], function(x) paste(x, 
        collapse = ", "))
    obj.colnames.short <- sapply(obj.colnames, function(x) paste(substr(x, 
        1, 150), "...."))
    obj.colnames <- ifelse(nchar(obj.colnames) > 154, obj.colnames.short, 
        obj.colnames)
    obj.colnames <- sapply(obj.colnames, function(x) paste("Column names: ",x))
                    
    obj.content[has_colnames] <- obj.colnames
                           
    is_function <- (obj.type == "function")
    obj.content[is_function] <- napply(names[is_function], function(x) paste(strsplit(repr_text(x),")")[[1]][1],")",sep=""))
    obj.content <- unlist(obj.content, use.names = FALSE)
    

    out <- data.frame(obj.type, obj.size, obj.dim)
    names(out) <- c("varType", "varSize", "Rows", "Columns")
    out$varShape <- paste(out$Rows, " x ", out$Columns)
    out$varContent <- obj.content
    out$isMatrix <- FALSE
    out$varName <- row.names(out)
    out <- out[, !(names(out) %in% c("Rows", "Columns"))]
    rownames(out) <- NULL
    print(out)
    if (!missing(order.by)) 
        out <- out[order(out[[order.by]], decreasing = decreasing), 
            ]
    if (head) 
        out <- head(out, n)
    jsonlite::toJSON(out)
}

.deleteVariable <- function(x) {
    remove(list=c(x), envir=.GlobalEnv)
}
    `;
Languages.scripts = {
    "python3": {
        initScript: Languages.py_script,
        queryCommand: "_jupyterlab_variableinspector_dict_list()",
        matrixQueryCommand: "_jupyterlab_variableinspector_getmatrixcontent",
        widgetQueryCommand: "_jupyterlab_variableinspector_displaywidget",
        deleteCommand: "_jupyterlab_variableinspector_deletevariable"
    },
    "python2": {
        initScript: Languages.py_script,
        queryCommand: "_jupyterlab_variableinspector_dict_list()",
        matrixQueryCommand: "_jupyterlab_variableinspector_getmatrixcontent",
        widgetQueryCommand: "_jupyterlab_variableinspector_displaywidget",
        deleteCommand: "_jupyterlab_variableinspector_deletevariable"
    },
    "python": {
        initScript: Languages.py_script,
        queryCommand: "_jupyterlab_variableinspector_dict_list()",
        matrixQueryCommand: "_jupyterlab_variableinspector_getmatrixcontent",
        widgetQueryCommand: "_jupyterlab_variableinspector_displaywidget",
        deleteCommand: "_jupyterlab_variableinspector_deletevariable"
    },
    "R": {
        initScript: Languages.r_script,
        queryCommand: ".ls.objects()",
        matrixQueryCommand: ".ls.objects",
        widgetQueryCommand: "TODO",
        deleteCommand: ".deleteVariable"
    }
};


/***/ }),

/***/ "./lib/kernelconnector.js":
/*!********************************!*\
  !*** ./lib/kernelconnector.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "KernelConnector": () => (/* binding */ KernelConnector)
/* harmony export */ });
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/signaling */ "webpack/sharing/consume/default/@lumino/signaling");
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_signaling__WEBPACK_IMPORTED_MODULE_0__);

/**
 * Connector class that handles execute request to a kernel
 */
class KernelConnector {
    constructor(options) {
        this._kernelRestarted = new _lumino_signaling__WEBPACK_IMPORTED_MODULE_0__.Signal(this);
        this._session = options.session;
        this._session.statusChanged.connect((sender, new_status) => {
            switch (new_status) {
                case "restarting":
                case "autorestarting":
                    this._kernelRestarted.emit(this._session.ready);
                default:
                    break;
            }
        });
    }
    get kernelRestarted() {
        return this._kernelRestarted;
    }
    get kernelLanguage() {
        return this._session.session.kernel.info.then(infoReply => {
            return infoReply.language_info.name;
        });
    }
    get kernelName() {
        return this._session.kernelDisplayName;
    }
    /**
     *  A Promise that is fulfilled when the session associated w/ the connector is ready.
     */
    get ready() {
        return this._session.ready;
    }
    /**
     *  A signal emitted for iopub messages of the kernel associated with the kernel.
     */
    get iopubMessage() {
        return this._session.iopubMessage;
    }
    /**
     * Executes the given request on the kernel associated with the connector.
     * @param content: IExecuteRequestMsg to forward to the kernel.
     * @param ioCallback: Callable to forward IOPub messages of the kernel to.
     * @returns Promise<KernelMessage.IExecuteReplyMsg>
     */
    fetch(content, ioCallback, index) {
        const kernel = this._session.session.kernel;
        if (!kernel) {
            return Promise.reject(new Error("Require kernel to perform variable inspection!"));
        }
        let future = kernel.requestExecute(content);
        future.onIOPub = ((msg) => {
            ioCallback(msg, index);
        });
        return future.done;
    }
    execute(content) {
        return this._session.session.kernel.requestExecute(content);
    }
}


/***/ }),

/***/ "./lib/manager.js":
/*!************************!*\
  !*** ./lib/manager.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "IVariableInspectorManager": () => (/* binding */ IVariableInspectorManager),
/* harmony export */   "VariableInspectorManager": () => (/* binding */ VariableInspectorManager)
/* harmony export */ });
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/coreutils */ "webpack/sharing/consume/default/@lumino/coreutils");
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__);

const IVariableInspectorManager = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__.Token("jupyterlab_extension/variableinspector:IVariableInspectorManager");
/**
 * A class that manages variable inspector widget instances and offers persistent
 * `IVariableInspector` instance that other plugins can communicate with.
 */
class VariableInspectorManager {
    constructor() {
        this._source = null;
        this._panel = null;
        this._handlers = {};
    }
    hasHandler(id) {
        if (this._handlers[id]) {
            return true;
        }
        else {
            return false;
        }
    }
    getHandler(id) {
        return this._handlers[id];
    }
    addHandler(handler) {
        this._handlers[handler.id] = handler;
    }
    /**
     * The current inspector panel.
     */
    get panel() {
        return this._panel;
    }
    set panel(panel) {
        if (this.panel === panel) {
            return;
        }
        this._panel = panel;
        if (panel && !panel.source) {
            panel.source = this._source;
        }
    }
    /**
     * The source of events the inspector panel listens for.
     */
    get source() {
        return this._source;
    }
    set source(source) {
        if (this._source === source) {
            return;
        }
        // remove subscriptions
        if (this._source) {
            this._source.disposed.disconnect(this._onSourceDisposed, this);
        }
        this._source = source;
        if (this._panel && !this._panel.isDisposed) {
            this._panel.source = this._source;
        }
        // Subscribe to new source
        if (this._source) {
            this._source.disposed.connect(this._onSourceDisposed, this);
        }
    }
    _onSourceDisposed() {
        this._source = null;
    }
}


/***/ }),

/***/ "./lib/variableinspector.js":
/*!**********************************!*\
  !*** ./lib/variableinspector.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "IVariableInspector": () => (/* binding */ IVariableInspector),
/* harmony export */   "VariableInspectorPanel": () => (/* binding */ VariableInspectorPanel)
/* harmony export */ });
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/coreutils */ "webpack/sharing/consume/default/@lumino/coreutils");
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @lumino/widgets */ "webpack/sharing/consume/default/@lumino/widgets");
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_lumino_widgets__WEBPACK_IMPORTED_MODULE_1__);
// import {
//     OutputAreaModel,
//     SimplifiedOutputArea
// } from '@jupyterlab/outputarea';


const TITLE_CLASS = "jp-VarInspector-title";
const PANEL_CLASS = "jp-VarInspector";
const TABLE_CLASS = "jp-VarInspector-table";
const TABLE_BODY_CLASS = "jp-VarInspector-content";
/**
 * The inspector panel token.
 */
const IVariableInspector = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__.Token("jupyterlab_extension/variableinspector:IVariableInspector");
function escapeHTML(s) {
    if (!s)
        return s;
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
/**
 * A panel that renders the variables
 */
class VariableInspectorPanel extends _lumino_widgets__WEBPACK_IMPORTED_MODULE_1__.Widget {
    constructor() {
        super();
        this._source = null;
        this.addClass(PANEL_CLASS);
        this._input_table = Private.createTable(["Name", "Type", "Value", "Shape"]);
        this._input_table.className = TABLE_CLASS;
        this._output_table = Private.createTable(["Name", "Type", "Value", "Shape"]);
        this._output_table.className = TABLE_CLASS;
        this.titles = new Map();
        this.TITLES = ["INPUTS", "OUTPUTS", "SUMMARY", "TRANSFORMS"];
        for (let name of this.TITLES) {
            this.titles.set(name, Private.createTitle(name));
            this.titles.get(name).className = TITLE_CLASS;
        }
        this.buttons = new Map();
        for (let name of this.TITLES) {
            this.buttons.set(name, Private.createButton(name));
            this.buttons.get(name).title = "show details";
        }
    }
    get source() {
        return this._source;
    }
    set source(source) {
        if (this._source === source) {
            // this._source.performInspection();
            return;
        }
        //Remove old subscriptions
        if (this._source) {
            this._source.inspected.disconnect(this.onInspectorUpdate, this);
            this._source.disposed.disconnect(this.onSourceDisposed, this);
        }
        this._source = source;
        //Subscribe to new object
        if (this._source) {
            this._source.inspected.connect(this.onInspectorUpdate, this);
            this._source.disposed.connect(this.onSourceDisposed, this);
            this._source.performInspection();
        }
    }
    /**
     * Dispose resources
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this.source = null;
        super.dispose();
    }
    add_button(button, title, data) {
        let summary_title = this.titles.get("SUMMARY");
        summary_title.appendChild(button);
        // create text after button
        let text;
        text = document.createElement("b");
        text.innerHTML = Object.entries(data).map(item => item[0]).join(", ");
        text.className = "plain-text";
        text.appendChild(document.createElement("br"));
        summary_title.appendChild(text);
        button.onclick = (ev) => {
            if (Object.keys(data).length <= 0)
                return;
            if (text.contains(title)) {
                text.removeChild(title);
                button.innerHTML = button.innerHTML.replace("fa-caret-down", "fa-caret-right");
            }
            else {
                text.appendChild(title);
                button.innerHTML = button.innerHTML.replace("fa-caret-right", "fa-caret-down");
            }
        };
    }
    onInspectorUpdate(sender, allArgs) {
        if (!this.isAttached) {
            return;
        }
        if (!("reply" in allArgs.title) || allArgs.title.reply == undefined) {
            return;
        }
        console.log(allArgs.title.reply);
        let data = allArgs.title.reply;
        // clear previous output
        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        }
        // filter the case with no data
        if ('msg' in data)
            return;
        for (let name of this.TITLES) {
            this.titles.set(name, Private.createTitle(name));
            this.titles.get(name).className = TITLE_CLASS;
        }
        for (let name of this.TITLES) {
            this.buttons.set(name, Private.createButton(name));
            this.buttons.get(name).title = "show details";
        }
        this.transform_tables = [];
        // add icon lib
        let v = document.createElement("p");
        v.innerHTML = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">`;
        this.node.appendChild(v);
        let summary_title = this.titles.get("SUMMARY");
        let _input_title = this.titles.get("INPUTS");
        let _output_title = this.titles.get("OUTPUTS");
        // let transform_title = this.titles.get("TRANSFORMS");
        this.add_button(this.buttons.get("INPUTS"), _input_title, data.input);
        this.add_button(this.buttons.get("OUTPUTS"), _output_title, data.output);
        // this.add_button(this.buttons.get("TRANSFORMS"), transform_title, data.summary);
        // let notes = document.createElement( "p" );
        // notes.innerHTML = highlightHTML("click button to see details; click one example to show more");
        this.node.appendChild(summary_title);
        // summary_title.appendChild( summary_table as HTMLElement );
        // summary_title.appendChild( notes as HTMLElement);
        if (Object.keys(data.summary).length > 0) {
            for (let flow in data.summary) {
                let flow_title = Private.createTitle(flow);
                flow_title.className = "box";
                // generate summary
                summary_title.appendChild(flow_title);
                summary_title.appendChild(document.createElement("br"));
                let patterns = data.summary[flow];
                this.generateSummary(patterns, flow_title);
                // generate table for each flow
                let raw_data = data.table[flow];
                let markers = data.partition[flow];
                let df_table = this.buildTable(raw_data, markers);
                flow_title.appendChild(df_table);
            }
        }
        if (Object.keys(data.input).length > 0) {
            this._input_table.deleteTFoot();
            this._input_table.createTFoot();
            this._input_table.tFoot.className = TABLE_BODY_CLASS;
            _input_title.appendChild(this._input_table);
            _input_title.appendChild(document.createElement("br"));
            Object.entries(data.input).forEach(item => this.processItem(item, this._input_table));
        }
        if (Object.keys(data.output).length > 0) {
            this._output_table.deleteTFoot();
            this._output_table.createTFoot();
            this._output_table.tFoot.className = TABLE_BODY_CLASS;
            _output_title.appendChild(this._output_table);
            _output_title.appendChild(document.createElement("br"));
            Object.entries(data.output).forEach(item => this.processItem(item, this._output_table));
        }
        // Object.entries(example).forEach(cell => {
        //     if(Number(cell[0]) != idx)
        //         return;
        // if (Object.keys(cell[1].function).length > 0) {
        //     Object.entries(cell[1].function).forEach(func => this.buildFunctionTable(func[0], func[1], this.function_tables));
        //     this.function_tables.forEach(x => function_title.appendChild(x));
        // }
        // integrate comments
        // if (Object.keys(cell[1].comment).length > 0) {
        //     let comment_table = Private.createTable(["loc", "comment"]);
        //     comment_table.className = TABLE_CLASS;
        //     comment_table.createTFoot();
        //     comment_table.tFoot.className = TABLE_BODY_CLASS;
        //     Object.entries(cell[1].comment).forEach(item => {
        //         let row = comment_table.tFoot.insertRow();
        //         let cell = row.insertCell(0);
        //         cell.innerHTML = item[0];
        //         cell = row.insertCell(1);
        //         cell.innerHTML = item[1];
        //     });
        //     let comment_title = this.titles.get("COMMENTS");
        //     // this.node.appendChild( comment_title as HTMLElement );
        //     comment_title.appendChild( comment_table as HTMLElement );
        // }   
        // })
    }
    generateSummary(patterns, flow_title) {
        if ("other_patterns" in patterns) {
            patterns.other_patterns.forEach((pattern, _) => {
                // let pattern = patterns.other_patterns[i];
                if ("removerow" in pattern) {
                    let ele = document.createElement("b");
                    ele.className = "tomato-text";
                    ele.innerHTML = pattern.removerow + " rows are removed;\n";
                    let sum_words = ele.outerHTML;
                    let sum_ele = Private.createText(sum_words);
                    flow_title.appendChild(sum_ele);
                }
                else if ("removerow_null" in pattern) {
                    let ele = document.createElement("b");
                    ele.className = "tomato-text";
                    ele.innerHTML = "remove rows";
                    let sum_words = ele.outerHTML + " containing null items of " + pattern.removerow_null + ";\n";
                    let sum_ele = Private.createText(sum_words);
                    flow_title.appendChild(sum_ele);
                }
                if ("removecol" in pattern) {
                    let ele = document.createElement("b");
                    ele.className = "tomato-text";
                    ele.innerHTML = "remove columns";
                    let sum_words = ele.outerHTML + ": " + pattern.removecol + ";\n";
                    let sum_ele = Private.createText(sum_words);
                    flow_title.appendChild(sum_ele);
                }
                if ("rearrange" in pattern) {
                    let cols = pattern.rearrange.split('|');
                    let ele = document.createElement("b");
                    ele.className = "tomato-text";
                    ele.innerHTML = "rearranged";
                    let sum_words = "columns " + cols[0] + " are " + ele.outerHTML + " to " + cols[1] + ";\n";
                    let sum_ele = Private.createText(sum_words);
                    flow_title.appendChild(sum_ele);
                }
            });
        }
        let new_cols = Object.keys(patterns).filter(col_str => {
            let cols = col_str.split('|');
            if (cols.length <= 1)
                return false;
            return cols[0] != cols[1];
        });
        let changed_cols = Object.keys(patterns).filter(col_str => {
            let cols = col_str.split('|');
            if (cols.length <= 1)
                return false;
            return cols[0] == cols[1];
        });
        function draw_summary(patterns, prefix, col_names) {
            let sum_words;
            let sum_ele;
            let ele = document.createElement("b");
            ele.className = "tomato-text";
            ele.innerHTML = prefix + " columns";
            sum_words = ele.outerHTML + ": " + col_names.map(x => x.split('|')[1]);
            sum_ele = Private.createText(sum_words);
            flow_title.appendChild(sum_ele);
            for (const col_str of col_names) {
                let cols = col_str.split('|');
                let ele = document.createElement("b");
                ele.className = "tomato-text";
                ele.innerHTML = patterns[col_str].join('(') + "(" + cols[0] + ")".repeat(patterns[col_str].length);
                sum_words = cols[1] + " = " + ele.outerHTML;
                let sum_ele = Private.createText(sum_words);
                sum_ele.className = "padded-text";
                flow_title.appendChild(sum_ele);
            }
        }
        if (changed_cols.length > 0) {
            draw_summary(patterns, "changed", changed_cols);
        }
        if (new_cols.length > 0) {
            draw_summary(patterns, "new", new_cols);
        }
    }
    buildTable(content, markers) {
        let row;
        let cell;
        let button = Private.createSmallButton("fa fa-plus");
        let columns = Object.keys(content);
        let df_table = Private.createTable([''].concat(columns));
        df_table.className = TABLE_CLASS;
        df_table.createTFoot();
        df_table.tFoot.className = TABLE_BODY_CLASS;
        let maxlen = Object.keys(content[columns[0]]).length;
        for (let i = 0; i < 2; i++) {
            row = df_table.tFoot.insertRow();
            row.style.backgroundColor = "lightgray";
            cell = row.insertCell(0);
            if (i == 0) {
                cell.innerHTML = "type";
            }
            else if (i == 1) {
                cell.innerHTML = "range";
                cell.title = "object: N = num of distinct values;\nnumber: [A, B] = range";
            }
            Private.read_row(row, content, columns, i);
        }
        // let initlen = Math.min(5, maxlen);
        // for (let i = 2; i < initlen; i++) {
        //     row = df_table.tFoot.insertRow();
        //     cell = row.insertCell(0);
        //     cell.innerHTML = String(i - 2);
        //     Private.read_row(row, content, columns, i);
        // }
        // check markers
        if (Object.keys(markers).length > 0) {
            let paths = [];
            let bounds = [];
            for (let path in markers) {
                paths.push(path);
                bounds.push(markers[path] + 2);
            }
            bounds.push(maxlen);
            for (let i = 0; i < paths.length; i++) {
                row = df_table.tFoot.insertRow();
                // add button
                cell = row.insertCell(0);
                cell.id = String(bounds[i]) + ":" + String(bounds[i + 1]);
                cell.appendChild(Private.createSmallButton("fas fa-search-plus", String(bounds[i + 1] - bounds[i])));
                // initialize
                Private.read_row(row, content, columns, bounds[i]);
                cell.title = `[Size ${bounds[i + 1] - bounds[i]}], Path: ${paths[i]}, click to show more examples`;
                cell.addEventListener("click", function () {
                    let [cur_idx, bound_idx] = this.id.split(":").map(Number);
                    cur_idx++;
                    if (cur_idx >= bound_idx) {
                        return;
                    }
                    let new_row = df_table.insertRow(this.parentNode["rowIndex"] + 1);
                    cell = new_row.insertCell(0);
                    Private.read_row(new_row, content, columns, cur_idx);
                    this.id = `${cur_idx}:${bound_idx}`;
                });
            }
        }
        else {
            // draw first 5 rows
            let initlen = Math.min(7, maxlen);
            // first row
            row = df_table.tFoot.insertRow();
            // add button
            cell = row.insertCell(0);
            cell.id = String(initlen - 1) + ":" + String(maxlen);
            cell.appendChild(Private.createSmallButton("fas fa-search-plus", String(maxlen - 2)));
            Private.read_row(row, content, columns, 2);
            cell.title = `click to show more examples`;
            cell.addEventListener("click", function () {
                let [cur_idx, bound_idx] = this.id.split(":").map(Number);
                cur_idx++;
                if (cur_idx >= bound_idx) {
                    return;
                }
                let new_row = df_table.insertRow();
                cell = new_row.insertCell(0);
                // cell.innerHTML = String(cur_idx - 2);
                Private.read_row(new_row, content, columns, cur_idx);
                this.id = `${cur_idx}:${bound_idx}`;
            });
            // next 4 rows
            for (let i = 3; i < initlen; i++) {
                row = df_table.tFoot.insertRow();
                cell = row.insertCell(0);
                // cell.innerHTML = String(i - 2);
                Private.read_row(row, content, columns, i);
            }
        }
        return df_table;
    }
    processItem(item, table) {
        let row;
        row = table.tFoot.insertRow();
        let cell = row.insertCell(0);
        cell.innerHTML = item[0];
        cell = row.insertCell(1);
        cell.innerHTML = item[1].type; // should escape HTML chars
        cell = row.insertCell(2);
        cell.innerHTML = String(item[1].value);
        if (item[1].type.startsWith("DataFrame")) {
            cell = row.insertCell(3);
            cell.innerHTML = String(item[1].shape);
            // cell = row.insertCell( 4 );
            // cell.innerHTML = highlightHTML(item[1].hint);
        }
    }
    /**
     * Handle source disposed signals.
     */
    onSourceDisposed(sender, args) {
        this.source = null;
    }
}
var Private;
(function (Private) {
    function read_row(row, content, columns, idx) {
        let cell;
        for (let [j, col] of columns.entries()) {
            cell = row.insertCell(j + 1);
            if (typeof content[col][idx] == "string")
                cell.innerHTML = escapeHTML(content[col][idx]);
            else
                cell.innerHTML = escapeHTML(JSON.stringify(content[col][idx]));
            if (col.endsWith("-[auto]")) {
                cell.innerHTML = `<s>${cell.innerHTML}</s>`;
                cell.addEventListener("click", function () {
                    if (this.innerHTML.startsWith('<s>')) {
                        this.innerHTML = this.innerHTML.slice(3, -4);
                    }
                    else {
                        this.innerHTML = `<s>${this.innerHTML}</s>`;
                    }
                });
            }
            else if (col.endsWith("[auto]")) {
                cell.innerHTML = `<b>${cell.innerHTML}</b>`;
            }
        }
    }
    Private.read_row = read_row;
    function createTable(columns) {
        let table = document.createElement("table");
        table.id = columns[0].slice(0, -1);
        table.createTHead();
        let hrow = table.tHead.insertRow(0);
        for (let i = 0; i < columns.length; i++) {
            let cell1 = hrow.insertCell(i);
            let col = columns[i];
            cell1.innerHTML = col;
            if (columns[i].endsWith('[auto]')) {
                cell1.innerHTML = col.slice(0, -7);
                col = col.slice(0, -6);
                cell1.appendChild(document.createElement("br"));
                if (col.endsWith("-")) {
                    let button = createSmallButton("fas fa-minus");
                    button.title = "removed column";
                    cell1.appendChild(button);
                }
                else if (col.endsWith("+")) {
                    let button = createSmallButton("fas fa-plus");
                    button.title = "added column";
                    cell1.appendChild(button);
                }
                else if (col.endsWith("*")) {
                    let button = createSmallButton("fas fa-star-of-life");
                    button.title = "changed column";
                    cell1.appendChild(button);
                }
                else if (col.endsWith(">")) {
                    let button = createSmallButton("fas fa-eye");
                    button.title = "read column";
                    cell1.appendChild(button);
                }
            }
        }
        return table;
    }
    Private.createTable = createTable;
    function createTitle(header = "") {
        let title = document.createElement("p");
        title.innerHTML = `<h1 style="font-family:verdana;font-size:130%;text-align:center;"> ${header} </h1>`;
        return title;
    }
    Private.createTitle = createTitle;
    function createButton(text = "") {
        let button = document.createElement("button");
        button.className = "btn";
        button.innerHTML = `<i class="fa fa-caret-right"></i> ` + text;
        return button;
    }
    Private.createButton = createButton;
    function createSmallButton(icon, text = "") {
        let button = document.createElement("button");
        button.className = "small-btn";
        button.innerHTML = `<i class="${icon}"></i> ` + text;
        return button;
    }
    Private.createSmallButton = createSmallButton;
    function createText(text, color = "") {
        let ele = document.createElement("p");
        if (color == "")
            ele.style.cssText = `font-family:'verdana'`;
        else
            ele.style.cssText = `font-family:'verdana';color:${color};`;
        ele.innerHTML = "\t" + text;
        // ele.appendChild(document.createElement("br"))
        return ele;
    }
    Private.createText = createText;
})(Private || (Private = {}));


/***/ })

}]);
//# sourceMappingURL=lib_index_js.048f12da9f100c7e7bed.js.map