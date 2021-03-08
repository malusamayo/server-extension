// import {
//     OutputAreaModel,
//     SimplifiedOutputArea
// } from '@jupyterlab/outputarea';

import {
    IRenderMimeRegistry
} from '@jupyterlab/rendermime';

import {
    Kernel, 
    KernelMessage 
} from '@jupyterlab/services';

import {
    ISignal
} from '@lumino/signaling';

import {
    Token
} from '@lumino/coreutils';

import {
    //  DockLayout, 
     Widget,
} from '@lumino/widgets';

import {
    // DataGrid, 
    DataModel
} from "@lumino/datagrid";


const TITLE_CLASS = "jp-VarInspector-title";
const PANEL_CLASS = "jp-VarInspector";
const TABLE_CLASS = "jp-VarInspector-table";
const TABLE_BODY_CLASS = "jp-VarInspector-content";

/**
 * The inspector panel token.
 */
export
    const IVariableInspector = new Token<IVariableInspector>( "jupyterlab_extension/variableinspector:IVariableInspector" );

/**
 * An interface for an inspector.
 */
export
    interface IVariableInspector {
    source: IVariableInspector.IInspectable | null;

}

/**
 * A namespace for inspector interfaces.
 */
export
namespace IVariableInspector {

    export
        interface IInspectable {
        disposed: ISignal<any, void>;
        inspected: ISignal<any, IVariableInspectorUpdate>;
        rendermime: IRenderMimeRegistry;
        performInspection(reply?: any): void;
        performMatrixInspection( varName: string, maxRows? : number ): Promise<DataModel>;
        performWidgetInspection( varName: string ): Kernel.IShellFuture<KernelMessage.IExecuteRequestMsg, KernelMessage.IExecuteReplyMsg>;
        performDelete( varName: string ): void;
    }

    export
        interface IVariableInspectorUpdate {
        title: IVariableTitle;
        payload: Array<IVariable>;
    } 

    export
        interface IVariable {
        varName: string;
        varSize: string;
        varShape: string;
        varContent: string;
        varType: string;
        isMatrix: boolean;
        isWidget: boolean;
    }
    export
        interface IVariableTitle {
            kernelName?: string;
            contextName?: string; //Context currently reserved for special information.
            reply?: any
        }
}

function escapeHTML(s: string) { 
    if (!s)
        return s;
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * A panel that renders the variables
 */
export
    class VariableInspectorPanel extends Widget implements IVariableInspector {

    private _source: IVariableInspector.IInspectable | null = null;
    
    private _input_table: HTMLTableElement;
    private _output_table: HTMLTableElement;
    private transform_tables: Array<HTMLTableElement>;
    private function_tables: Array<HTMLTableElement>;
    private titles: Map<String, HTMLElement>;
    private TITLES: Array<string>;
    private buttons: Map<String, HTMLButtonElement>;

    constructor() {
        super();
        this.addClass( PANEL_CLASS );
        this._input_table = Private.createTable(["Name", "Type","Value", "Shape"]);
        this._input_table.className = TABLE_CLASS;
        this._output_table = Private.createTable(["Name", "Type","Value","Shape"]);
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

    get source(): IVariableInspector.IInspectable | null {
        return this._source;
    }

    set source( source: IVariableInspector.IInspectable | null ) {

        if ( this._source === source ) {
           // this._source.performInspection();
            return;
        }
        //Remove old subscriptions
        if ( this._source ) {
            this._source.inspected.disconnect( this.onInspectorUpdate, this );
            this._source.disposed.disconnect( this.onSourceDisposed, this );
        }
        this._source = source;
        //Subscribe to new object
        if ( this._source ) {
            this._source.inspected.connect( this.onInspectorUpdate, this );
            this._source.disposed.connect( this.onSourceDisposed, this );
            this._source.performInspection();
        }
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        if ( this.isDisposed ) {
            return;
        }
        this.source = null;
        super.dispose();
    }

    protected add_button(button:HTMLElement, title:HTMLElement, data:any) {
        let summary_title = this.titles.get("SUMMARY");
        summary_title.appendChild(button);
        let text:HTMLElement;
        // if (title == this.titles.get("TRANSFORMS"))
        //     text = Private.createText(
        //         Object.entries(data).map(item => item[0]+": "+item[1]).join(", "), "tomato");
        // else  
        text= Private.createText(
            Object.entries(data).map(item => item[0]).join(", "), "black");
        summary_title.appendChild(text);
        button.onclick = (ev: MouseEvent): any => {
            if (Object.keys(data).length <= 0) 
                return;
            if (text.contains(title)){                   
                text.removeChild(title as HTMLElement);                
                button.innerHTML = button.innerHTML.replace("fa-caret-down", "fa-caret-right");
            } else { 
                text.appendChild(title as HTMLElement);
                button.innerHTML = button.innerHTML.replace("fa-caret-right", "fa-caret-down");
            }
        };
    }

    protected onInspectorUpdate( sender: any, allArgs: IVariableInspector.IVariableInspectorUpdate): void {
        if (!this.isAttached) {
            return;
        }
        if (!("reply" in allArgs.title) || allArgs.title.reply == undefined) {
            return
        }
        console.log(allArgs.title.reply);
        let data = allArgs.title.reply;

        // clear previous output
        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        }

        // filter the case with no data
        if ('msg' in data)
            return

            
        for (let name of this.TITLES) {
            this.titles.set(name, Private.createTitle(name));
            this.titles.get(name).className = TITLE_CLASS;
        }   
        for (let name of this.TITLES) {
            this.buttons.set(name, Private.createButton(name));
            this.buttons.get(name).title = "show details";
        }   
        this.transform_tables = []
        
        // add icon lib
        let v = document.createElement("p");
        v.innerHTML = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">`
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
        this.node.appendChild( summary_title as HTMLElement );
        // summary_title.appendChild( summary_table as HTMLElement );
        // summary_title.appendChild( notes as HTMLElement);

        if (Object.keys(data.summary).length > 0) {
            for (let flow in data.summary) {
                let flow_title = Private.createTitle(flow);
                
                // generate summary
                summary_title.appendChild( flow_title as HTMLElement );
                let patterns = data.summary[flow];
                this.generateSummary(patterns, flow_title);

                // generate table for each flow
                let raw_data = data.table[flow];
                let markers = data.partition[flow];

                let table = this.buildTable(raw_data, markers);
                flow_title.appendChild(table as HTMLElement);                
            }
        }
                   
        if (Object.keys(data.input).length > 0) {
            this._input_table.deleteTFoot();
            this._input_table.createTFoot();
            this._input_table.tFoot.className = TABLE_BODY_CLASS;
            _input_title.appendChild( this._input_table as HTMLElement );
            Object.entries(data.input).forEach(item => this.processItem(item, this._input_table) );       
        }

        if (Object.keys(data.output).length > 0) {
            this._output_table.deleteTFoot();
            this._output_table.createTFoot();
            this._output_table.tFoot.className = TABLE_BODY_CLASS;
            _output_title.appendChild( this._output_table as HTMLElement );
            Object.entries(data.output).forEach(item => this.processItem(item, this._output_table) );
            // this.transform_tables.forEach(x => transform_title.appendChild(x));
        }

        // new codes  

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

    protected generateSummary(patterns: any, flow_title: HTMLElement) {
        if ("other_patterns" in patterns) {
            // for (let i = 0; i < patterns.other_patterns.length; i++) {
                
            // }
            patterns.other_patterns.forEach( (pattern, _) => {
                // let pattern = patterns.other_patterns[i];
                if ("removerow" in pattern) {
                    let sum_words = pattern.removerow + " rows are removed;"
                    let sum_ele = Private.createText(sum_words, 'tomato');
                    flow_title.appendChild( sum_ele );
                } else if ("removerow_null" in pattern) {
                    let sum_words = "rows containing null items of " + pattern.removerow_null + " are removed;"
                    let sum_ele = Private.createText(sum_words, 'tomato');
                    flow_title.appendChild( sum_ele );
                }
                if ("removecol" in pattern) {
                    let sum_words = "old columns: " + pattern.removecol + " are removed;"
                    let sum_ele = Private.createText(sum_words, 'tomato');
                    flow_title.appendChild( sum_ele );
                }
                if ("rearrange" in pattern) {
                    let cols = pattern.rearrange.split('|');
                    let sum_words = "columns " + cols[0] + " are rearranged to " + cols[1] + ";"
                    let sum_ele = Private.createText(sum_words, 'tomato');
                    flow_title.appendChild( sum_ele );
                }
            });
        }
        for (let col_str in patterns) {
            if (col_str == "other_patterns")
                continue;
            let cols = col_str.split('|');
            let sum_words = "";
            if (cols[0]!=cols[1])
                sum_words += "new ";
            sum_words = "columns: " + cols[1] + " are ";
            sum_words += patterns[col_str].join(' of ');
            sum_words += " of " + cols[0];
            let sum_ele = Private.createText(sum_words, 'tomato');
            flow_title.appendChild( sum_ele );
        }
    }


    protected buildTable(content:any, markers: any) {
        let row: HTMLTableRowElement;
        let cell: HTMLTableDataCellElement;
        let columns = Object.keys(content);
        let df_table = Private.createTable([''].concat(columns));
        df_table.className = TABLE_CLASS;
        df_table.createTFoot();
        df_table.tFoot.className = TABLE_BODY_CLASS;
        let maxlen = Object.keys(content[columns[0]]).length;

        for (let i = 0; i < 2; i++) {
            row = df_table.tFoot.insertRow();
            cell = row.insertCell(0);
            if (i == 0) {
                cell.innerHTML = "type";
            } else if (i == 1) {
                cell.innerHTML = "range";
            }
            Private.read_row(row, content, columns, i);
        }

        // check markers
        if (Object.keys(markers).length > 0) {
            let paths = [];
            let bounds = [];
            for (let path in markers) {
                paths.push(path);
                bounds.push(markers[path]+2);
            }
            bounds.push(maxlen);
            for (let i = 0; i < paths.length; i++) {
                row = df_table.tFoot.insertRow();
                row.id = String(bounds[i])+ ":" + String(bounds[i+1]);
                // add button
                cell = row.insertCell(0);
                cell.innerHTML = `<button class="small-btn"><i class="fa fa-plus"> ${bounds[i+1]-bounds[i]}</i></button>`;
                // initialize
                Private.read_row(row, content, columns, bounds[i]);

                row.title = `[Size ${bounds[i+1]-bounds[i]}], Path: ${paths[i]}, click to show more examples`;
                row.addEventListener("click", function(this) {
                    let [cur_idx, bound_idx] = this.id.split(":").map(Number);
                    cur_idx++;
                    if (cur_idx >= bound_idx) {
                        return
                    }
                    let new_row = df_table.insertRow(this.rowIndex + 1);
                    cell = new_row.insertCell(0);
                    Private.read_row(new_row, content, columns, cur_idx);
                    this.id = `${cur_idx}:${bound_idx}`;
                });
            }
        } else {
            let initlen = Math.min(7, maxlen);
            for (let i = 2; i < initlen; i++) {
            row = df_table.tFoot.insertRow();
            cell = row.insertCell(0);
            cell.innerHTML = String(i - 2);
            Private.read_row(row, content, columns, i);

            df_table.title = `click to show more examples`;
            df_table.id = String(initlen - 1) + ":" + String(maxlen)
            df_table.addEventListener("click", function(this) {
                let [cur_idx, bound_idx] = this.id.split(":").map(Number);
                cur_idx++;
                if (cur_idx >= bound_idx) {
                    return
                }
                let new_row = df_table.insertRow();
                cell = new_row.insertCell(0);
                cell.innerHTML = String(cur_idx - 2);
                Private.read_row(new_row, content, columns, cur_idx);
                
                this.id = `${cur_idx}:${bound_idx}`;
            });
        }

        }

        return df_table;
    }

    protected processItem(item:any, table:HTMLTableElement):void {
        let row: HTMLTableRowElement;
        row = table.tFoot.insertRow();
            
        let cell = row.insertCell( 0 );
        cell.innerHTML = item[0];
        cell = row.insertCell( 1 );
        cell.innerHTML = item[1].type; // should escape HTML chars
        cell = row.insertCell( 2 );
        cell.innerHTML = String(item[1].value);

        if (item[1].type.startsWith("DataFrame")) {
            cell = row.insertCell( 3 );
            cell.innerHTML = String(item[1].shape);
            // cell = row.insertCell( 4 );
            // cell.innerHTML = highlightHTML(item[1].hint);
        }
    }

    /**
     * Handle source disposed signals.
     */
    protected onSourceDisposed( sender: any, args: void ): void {
        this.source = null;
    }

}


namespace Private {

    export 
        function read_row(row: HTMLTableRowElement, content: any, columns: string[], idx: number) {
        let cell: HTMLTableDataCellElement;
        for (let [j, col] of columns.entries()) {
            cell = row.insertCell(j + 1);
            if (typeof content[col][idx] == "string") 
                cell.innerHTML = escapeHTML(content[col][idx]);
            else
                cell.innerHTML = escapeHTML(JSON.stringify(content[col][idx]));
            if (col.endsWith("-[auto]"))
                cell.innerHTML = `<s>${cell.innerHTML}</s>`;
            else if (col.endsWith("[auto]"))
                cell.innerHTML = `<b>${cell.innerHTML}</b>`;
        }
    }

    export
        function createTable(columns: any): HTMLTableElement {
        let table = document.createElement( "table" );
        table.id = columns[0].slice(0, -1);
        table.createTHead();
        let hrow = <HTMLTableRowElement>table.tHead.insertRow( 0 );
        for (let i =0; i< columns.length; i++) {
            let cell1 = hrow.insertCell( i );
            cell1.innerHTML = columns[i].replace('[auto]', '');
        }
        return table;
    }

    export
        function createTitle(header="") {
        let title = document.createElement( "p" );
        title.innerHTML = `<h1 style="font-family:verdana;font-size:130%;text-align:center;"> ${header} </h1>`
        return title;
    }

    export 
        function createButton(text="") {
        let button = document.createElement("button");
        button.className = "btn";
        button.innerHTML = `<i class="fa fa-caret-right"></i> ` + text;
        return button;
    }

    export 
        function createText(text: string, color: string) {
        let ele = document.createElement( "b" );
        ele.style.cssText = `font-family:'verdana';color:${color};`;
        ele.innerHTML = "\t"+text;
        ele.appendChild(document.createElement( "br" ));
        return ele;
    }
}
