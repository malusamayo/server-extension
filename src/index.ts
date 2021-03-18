import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
  ILayoutRestorer
} from '@jupyterlab/application';

import { 
  ICommandPalette, IFrame, ToolbarButton
  , WidgetTracker 
} from '@jupyterlab/apputils';

import { PageConfig } from '@jupyterlab/coreutils';

import { ILauncher } from '@jupyterlab/launcher';

import {IDocumentManager} from "@jupyterlab/docmanager"

// import {
//   IConsoleTracker
// } from '@jupyterlab/console';

import {
  INotebookTracker, NotebookPanel, INotebookModel
  //, NotebookPanel, NotebookActions
} from '@jupyterlab/notebook';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { extensionIcon } from '@jupyterlab/ui-components';

import {
  IFileBrowserFactory
} from '@jupyterlab/filebrowser';

import { CommandRegistry } from '@lumino/commands';

import { IDisposable } from '@lumino/disposable';

import {
  IVariableInspector, VariableInspectorPanel
} from "./variableinspector";

import {
  VariableInspectorManager, IVariableInspectorManager
} from "./manager";

import { VariableInspectionHandler, requestAPI } from './handler';

import {
    KernelConnector
} from "./kernelconnector";

import {
    Languages
} from "./inspectorscripts";

// import { ModelCardPanel } from './panel';

/**
 * The command IDs used by the server extension plugin.
 */
namespace CommandIDs {
  export const get = 'server:get-file';
  export const openClassic = 'jupyterlab-classic:open';
  export const open = "autodoc-panel:open";
}

/**
 * A service providing variable introspection.
 */
const variableinspector: JupyterFrontEndPlugin<IVariableInspectorManager> = {
    id: "jupyterlab-extension:autodoc-panel",
    requires: [ICommandPalette, ILayoutRestorer, ILabShell],
    provides: IVariableInspectorManager,
    autoStart: true,
    activate: ( app: JupyterFrontEnd, palette: ICommandPalette, restorer: ILayoutRestorer, labShell: ILabShell): IVariableInspectorManager => {
        
        
        const manager = new VariableInspectorManager();
        const category = "Autodoc Panel";
        const command = CommandIDs.open;
        const label = "Open Autodoc Panel";
        const namespace = "autodoc-panel";
        const tracker = new WidgetTracker<VariableInspectorPanel>( { namespace } );
        
        
        /**
         * Create and track a new inspector.
         */
        function newPanel(): VariableInspectorPanel {
            const panel = new VariableInspectorPanel();
            
            panel.id = "jp-autodoc-panel";
            panel.title.label = "Autodoc Panel";
            panel.title.closable = true;
            panel.disposed.connect(() => {
                if ( manager.panel === panel ) {
                    manager.panel = null;
                }
            } );
            
            //Track the inspector panel
            tracker.add( panel );
            
            return panel;
        }
        
        // Enable state restoration
        restorer.restore( tracker, {
            command,
            args: () => null,
            name: () => "autodoc-panel"
        } );
        
        // Add command to palette
        app.commands.addCommand( command, {
            label,
            execute: () => {
                if ( !manager.panel || manager.panel.isDisposed ) {
                    manager.panel = newPanel();
                }
                if ( !manager.panel.isAttached ) {
                    labShell.add( manager.panel, 'main' );
                }
                if ( manager.source ) {
                    manager.source.performInspection();
                }
                labShell.activateById( manager.panel.id );
            }
        } );
        palette.addItem( { command, category } );
        return manager;
    }
};

/**
 * A notebook widget extension that adds a jupyterlab classic button to the toolbar.
 */
class ClassicButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  /**
   * Instantiate a new ClassicButton.
   * @param commands The command registry.
   */
  constructor(commands: CommandRegistry) {
    // this._commands = commands;
  }

  /**
   * Create a new extension object.
   */
  createNew(panel: NotebookPanel): IDisposable {
    const button = new ToolbarButton({
      tooltip: 'Run AutoDoc in the backend',
      icon: extensionIcon,
      onClick: async () => {
        const dataToSend = { command: "run", path: panel["context"].path };
        try {
          const reply = await requestAPI<any>('hello', {
            body: JSON.stringify(dataToSend),
            method: 'POST'
          });
          console.log(reply);
          alert("AutoDoc has been run successfully in the backend!");
        } catch (reason) {
          console.error(
            `Error on POST /jlab-ext-example/hello ${dataToSend}.\n${reason}`
          );
          alert("AutoDoc ran into errors. Generation Failed.");
        }
      }
    });
    panel.toolbar.insertAfter('cellType', 'jupyterlabClassic', button);
    return button;
  }

  // private _commands: CommandRegistry;
}

/**
 * Initialization data for the server-extension-example extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'server-extension-example',
  autoStart: true,
  optional: [ILauncher],
  requires: [ILabShell, IDocumentManager, INotebookTracker, ICommandPalette, ILayoutRestorer],
  activate: async (
    app: JupyterFrontEnd,
    panel: NotebookPanel,
    labShell: ILabShell,
    docManager: IDocumentManager,
    palette: ICommandPalette,
    restorer: ILayoutRestorer,
    launcher: ILauncher | null
  ) => {
    console.log('JupyterLab extension server-extension-example is activated!');

    // Add the toolbar button to the notebook toolbar
    const { commands, docRegistry, shell } = app;
    const classicButton = new ClassicButton(commands);
    docRegistry.addWidgetExtension('Notebook', classicButton);

  }
};

/**
 * An extension that registers notebooks for variable inspection.
 */
const notebooks: JupyterFrontEndPlugin<void> = {
  id: "jupyterlab-extension:autodoc-panel:notebooks",
  requires: [IVariableInspectorManager, INotebookTracker , ILabShell],
  autoStart: true,
  activate: (app: JupyterFrontEnd, manager: VariableInspectorManager, notebooks: INotebookTracker, labShell: ILabShell ): void => {
    const handlers: { [id: string]: Promise<VariableInspectionHandler> } = {};
            
       /**
         * Subscribes to the creation of new notebooks. If a new notebook is created, build a new handler for the notebook.
         * Adds a promise for a instanced handler to the 'handlers' collection.
         */
        notebooks.widgetAdded.connect(( sender, nbPanel: NotebookPanel ) => {
            
            //A promise that resolves after the initialization of the handler is done.
            handlers[nbPanel.id] = new Promise( function( resolve, reject ) {
                
                const session = nbPanel.sessionContext;
                const connector = new KernelConnector( { session } );
                const rendermime = nbPanel.content.rendermime;
                
                let scripts: Promise<Languages.LanguageModel>;
                    scripts = connector.ready.then(() => {
                        return connector.kernelLanguage.then(lang => {
                            return Languages.getScript(lang);
                        });
                    });
                
                scripts.then(( result: Languages.LanguageModel ) => {
                    let initScript = result.initScript;
                    let queryCommand = result.queryCommand;
                    let matrixQueryCommand = result.matrixQueryCommand;
                    let widgetQueryCommand = result.widgetQueryCommand;
                    let deleteCommand = result.deleteCommand;
                    
                    const options: VariableInspectionHandler.IOptions = {
                            queryCommand: queryCommand,
                            matrixQueryCommand: matrixQueryCommand,
                            widgetQueryCommand,
                            deleteCommand: deleteCommand,
                            connector: connector,
                            rendermime,
                            initScript: initScript,
                            id: session.path  //Using the sessions path as an identifier for now.
                    };
                    const handler = new VariableInspectionHandler( options );
                    manager.addHandler(handler);
                    nbPanel.disposed.connect(() => {
                        delete handlers[nbPanel.id];
                        handler.dispose();
                    } );
                    
                    handler.ready.then(() => {
                        resolve( handler );
                    } );
                } );
                
                
                //Otherwise log error message.
                scripts.catch(( result: string ) => {
                    reject( result );
                } );
                } );
        } );
            

      // current cell change
      notebooks.activeCellChanged.connect(async ( sender, args ) => {
            // console.log(notebooks.currentWidget.content.activeCellIndex);
            let curCellIdx = notebooks.currentWidget.content.activeCellIndex;
            const dataToSend = { command: "fetch", path: notebooks.currentWidget.context.path, cell:curCellIdx };
          
            console.log("fetching data from backend");
            try {
                const reply = await requestAPI<any>('hello', {
                body: JSON.stringify(dataToSend),
                method: 'POST'
            });
                // console.log(reply);
                let future = handlers[notebooks.currentWidget.id];
                future.then((source :VariableInspectionHandler ) => {
                    if ( source ) {
                        manager.source = source;
                        console.log("start inspecting...")
                        manager.source.performInspection(reply);               
                    }
                });
            } catch (reason) {
                console.error(
                `Error on POST /jlab-ext-example/hello ${dataToSend}.\n${reason}`
                );
            }
            console.log(curCellIdx)
      } );

      
    app.contextMenu.addItem( {
        command: CommandIDs.open,
        selector: ".jp-Notebook"
    } );
  }
};

/**
* Export the plugins as default.
*/
const plugins: JupyterFrontEndPlugin<any>[] = [variableinspector, extension, notebooks];


export default plugins;

