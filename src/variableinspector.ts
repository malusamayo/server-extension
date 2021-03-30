import {
    IRenderMimeRegistry
} from '@jupyterlab/rendermime';

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
    private titles: Map<String, HTMLElement>;
    private TITLES: Array<string>;
    private buttons: Map<String, HTMLButtonElement>;
    private HINTS = {
        "str": "convert column to str type",
        "category": "convert column to category type",
        "int": "convert column to int type",
        "encode": 
        `encode column in consecutive integers
        e.g., [x, y, z, y, x] -> [0, 1, 2, 1, 0]`,
        "one_hot_encoding": 
        `encode column in binary (0/1) integers
        e.g., [x, y, z, y, x] -> col_x [1, 0, 0, 0, 1]
              [x, y, z, y, x] -> col_y [0, 1, 0, 1, 0]
              [x, y, z, y, x] -> col_z [0, 0, 1, 0, 0]`,
        "float": "convert column to float type",
        "type_convert": "convert column type",
        "fillna": 
        `fill null/nan values
        e.g., [3, 4, nan, 2, nan] -> [3, 4, 0, 2, 0]`,
        "merge": 
        `merge different items
        e.g., [Mon, Monday, Thursday, Thur] -> [Mon, Mon, Thu, Thu] `,
        "num_transform": 
        `unspecified numerical transformation
        e.g., [2, 3, 4] -> [20, 30, 40]`,
        "str_transform": 
        `unspecified string transformation
        e.g., [S1, D2, C3, K1] -> [S, D, C, K]`,
        "substr": "take substring from column",
        "compute": "unspecified transformation"
    };

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

        // create text after button
        let text:HTMLElement;
        text = document.createElement("b");
        text.innerHTML = Object.entries(data).map(item => item[0]).join(", ");
        text.className = "plain-text";
        text.appendChild(document.createElement("br"));

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

    public onInspectorUpdate( sender: any, allArgs: IVariableInspector.IVariableInspectorUpdate): void {
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

        this.node.appendChild( summary_title as HTMLElement );
        summary_title.appendChild(document.createElement("br"));


        if (Object.keys(data.summary).length > 0) {
            for (let flow in data.summary) {
                let flow_title = Private.createTitle(flow);
                flow_title.className = "box";
                
                // let button = Private.createButton(flow);                
                // button.onclick = (ev: MouseEvent): any => {
                //     if (Object.keys(data).length <= 0) 
                //         return;
                //     if (summary_title.contains(flow_title)){                   
                //         summary_title.removeChild(flow_title as HTMLElement);                
                //         button.innerHTML = button.innerHTML.replace("fa-caret-down", "fa-caret-right");
                //     } else { 
                //         summary_title.appendChild(flow_title as HTMLElement);
                //         button.innerHTML = button.innerHTML.replace("fa-caret-right", "fa-caret-down");
                //     }
                // };
                // summary_title.appendChild(button);
                
                // generate summary
                summary_title.appendChild( flow_title as HTMLElement );
                summary_title.appendChild(document.createElement("br"));
                let patterns = data.summary[flow];
                this.generateSummary(patterns, flow_title);

                // generate table for each flow
                let raw_data = data.table[flow];
                let markers = data.partition[flow];

                let df_table = this.buildTable(raw_data, markers);
                flow_title.appendChild(df_table as HTMLElement);      
            }
        }
                   
        if (Object.keys(data.input).length > 0) {
            this._input_table.deleteTFoot();
            this._input_table.createTFoot();
            this._input_table.tFoot.className = TABLE_BODY_CLASS;
            _input_title.appendChild( this._input_table as HTMLElement );
            _input_title.appendChild(document.createElement("br"));
            Object.entries(data.input).forEach(item => this.processItem(item, this._input_table) );       
        }

        if (Object.keys(data.output).length > 0) {
            this._output_table.deleteTFoot();
            this._output_table.createTFoot();
            this._output_table.tFoot.className = TABLE_BODY_CLASS;
            _output_title.appendChild( this._output_table as HTMLElement );
            _output_title.appendChild(document.createElement("br"));
            Object.entries(data.output).forEach(item => this.processItem(item, this._output_table) );
        }


    }

    protected draw_inner_summary(patterns:any, prefix: string, col_names: string[], flow_title:HTMLElement) {
        let sum_words: string;
        let sum_ele: HTMLElement;
        let ele = document.createElement("b");
        ele.className = "tomato-text";
        ele.innerHTML = prefix + " columns"
        sum_words = ele.outerHTML + ": [" + col_names.map(x => x.split('|')[1]) + "]";
        sum_ele = Private.createText(sum_words);
        flow_title.appendChild( sum_ele );
        for (const col_str of col_names) {
            let cols = col_str.split('|');
            patterns[col_str] = patterns[col_str].map((x: string) => {
                let ele = document.createElement("b");
                ele.className = "tomato-text";
                ele.innerHTML = x;
                ele.title = x + ": " + this.HINTS[x];
                return ele.outerHTML;
            })
            // let ele = document.createElement("b");
            // ele.className = "tomato-text";
            // ele.innerHTML = patterns[col_str].join('(') + "(" + cols[0] + ")".repeat(patterns[col_str].length);
            // ele.title = "";
            // for (const p of patterns[col_str]) {
            //     ele.title = p + ": " + this.HINTS[p] + "\n" + ele.title;
            // }
            sum_words = cols[1] + " = " + patterns[col_str].join('(') + "(" + cols[0] + ")".repeat(patterns[col_str].length);
            let sum_ele = Private.createText(sum_words);
            sum_ele.className = "padded-text";
            flow_title.appendChild( sum_ele );
        }
    }

    protected generateSummary(patterns: any, flow_title: HTMLElement) {
        if ("other_patterns" in patterns) {
            patterns.other_patterns.forEach( (pattern, _) => {
                let ele = document.createElement("b");
                ele.className = "tomato-text";
                let sum_words = "";
                if ("removerow" in pattern || "removerow_dup" in pattern) {
                    ele.innerHTML = "remove " + pattern.removerow + ("removerow_dup" in pattern? " duplicated": "") + " rows";
                    sum_words = ele.outerHTML;
                } else if ("removerow_null" in pattern) {
                    let cols = pattern.removerow_null.split(",");
                    ele.innerHTML = "remove " + cols[0] +" rows";
                    ele.title = "removed rows contain null items in one of following columns: " + "[" + String(cols.slice(1)) + "]";
                    sum_words = ele.outerHTML + " based on null values";
                }
                if ("removecol" in pattern) {
                    ele.innerHTML = "remove columns";
                    // let col_ele = document.createElement("div");
                    // col_ele.className = "padded-div";
                    // col_ele.innerText = "[" + pattern.removecol + "]";
                    sum_words = ele.outerHTML + ": " +  "[" + pattern.removecol + "]" + "\n";
                }
                if ("rearrange" in pattern) {
                    let cols = pattern.rearrange.split('|');
                    ele.innerHTML = "rearrange columns";
                    sum_words = ele.outerHTML + ": [" + cols[0] + "] to [" + cols[1] + "]\n";
                }
                if ("copy" in pattern) {
                    ele.innerHTML = "copy dataframe";
                    sum_words = ele.outerHTML;
                }
                let sum_ele = Private.createText(sum_words);
                flow_title.appendChild( sum_ele );
            });
        }
        let new_cols = Object.keys(patterns).filter(col_str => {
            let cols = col_str.split('|');
            if (cols.length <=1)
                return false;
            return cols[0]!=cols[1]
        });
        let changed_cols = Object.keys(patterns).filter(col_str => {
            let cols = col_str.split('|');
            if (cols.length <=1)
                return false;
            return cols[0]==cols[1]
        });

        if (changed_cols.length > 0) {
            this.draw_inner_summary(patterns, "changed", changed_cols, flow_title);
        }
        if (new_cols.length > 0) {
            this.draw_inner_summary(patterns, "new", new_cols, flow_title);
        }
        flow_title.appendChild(document.createElement("br"));
    }


    private CLUSTER_HINTS = {
        "replace": {"0": "value unchanged", "1": "value changed", "-2": "error"},
        "strip": {"0": "value unchanged", "1": "values changed"},
        "upper": {"0": "value unchanged", "1": "value changed"},
        "lower": {"0": "value unchanged", "1": "value changed"},
        "if_expr": {"0": "take False branch", "1": "take True branch"},
        "loc/at": {"0": "value unchanged", "1": "value replaced"},
        "empty": {"0": "default cluster"},
        "removed": {"0": "removed rows"}
    };

    protected buildClusterHints(num: number, size: number, path: string) {
        let ret: string;
        ret = "Cluster No." + String(num) + "\n";
        ret += "Size: " + String(size) + "\n";
        ret += "Paths:\n";
        let items = JSON.parse(path.replace(/'/g, '"'));
        for (let i of items) {
            let f_name = i[i.length - 1];
            ret += "\t" + f_name.replace("default_", "") + ": ";
            if (f_name in this.CLUSTER_HINTS) {
                ret += this.CLUSTER_HINTS[f_name][i[0]];
            } else {
                switch(f_name) {
                    case "replace_ls": {
                        if (i[0] == "-1")
                            ret += "value unchanged"
                        else
                            ret += "value replaced with No." + i[0] + " item in list";
                        break;
                    }
                    case "split": {
                        if (i[0] == "-2")
                            ret += "error"
                        else
                            ret += "value split into " + i[0] + " items";
                        break;
                    }
                    case "fillna": {
                        if (i[0] == "0")
                            ret += "value unchanged"
                        else
                            ret += "fill " + i[0] + " nan items";
                        break;
                    }
                    case "map_dict": {
                        if (i[0] == "-1")
                            ret += "value unchanged"
                        else
                            ret += "value replaced with No." + i[0] + " item in map";
                        break;
                    }
                    default: {
                        if (f_name.startsWith("default")) {
                            if (i[0] == "DUMMY")
                                ret += "value unchanged"
                            else
                                ret += "value set to " + i[0];
                            break;
                        }
                        let exec = i[0].map(Number);
                        let min = Math.min(...exec);
                        exec = exec.map(x => x - min);
                        ret += "path: " + String(exec);
                    }
                }
            }
            ret += "\n";
        }
        ret += "click to see more examples\n";
        return ret
    }

    protected buildTable(content:any, markers: any) {
        let row: HTMLTableRowElement;
        let cell: HTMLTableDataCellElement;

        if (!content)
            return document.createElement("br");

        let columns = Object.keys(content);
        let df_table = Private.createTable([''].concat(columns));
        df_table.className = TABLE_CLASS;
        df_table.createTFoot();
        df_table.tFoot.className = TABLE_BODY_CLASS;
        let maxlen = Object.keys(content[columns[0]]).length;

        for (let i = 0; i < 3; i++) {
            row = df_table.tFoot.insertRow();
            row.style.backgroundColor = "lightgray";
            cell = row.insertCell(0);
            if (i == 0) {
                cell.innerHTML = "type";
                cell.title = "object: usually refers to str type";
                cell.style.cursor = "pointer";
            } else if (i == 1) {
                cell.innerHTML = "unique";
                cell.title = "unique values of the column";
                cell.style.cursor = "pointer";
            } else if (i == 2) {
                cell.innerHTML = "range";
                cell.title = "For number type: [A, B] = [min, max]";
                cell.style.cursor = "pointer";
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
                bounds.push(markers[path]+3);
            }
            bounds.push(maxlen);
            for (let i = 0; i < paths.length; i++) {
                row = df_table.tFoot.insertRow();
                // add button
                cell = row.insertCell(0);
                cell.id = String(bounds[i])+ ":" + String(bounds[i+1]);
                cell.appendChild(Private.createSmallButton("fas fa-search-plus", String(bounds[i+1]-bounds[i])));
                cell.title = this.buildClusterHints(i, bounds[i+1]-bounds[i], paths[i]);

                // initialize
                Private.read_row(row, content, columns, bounds[i], cell.title.includes("removed rows"));

                cell.addEventListener("click", function(this) {
                    let [cur_idx, bound_idx] = this.id.split(":").map(Number);
                    cur_idx++;
                    if (cur_idx >= bound_idx) {
                        return
                    }
                    let new_row = df_table.insertRow(this.parentNode["rowIndex"] + 1);
                    cell = new_row.insertCell(0);
                    Private.read_row(new_row, content, columns, cur_idx, this.title.includes("removed rows"));
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

        cell = row.insertCell( 3 );
        cell.innerHTML = String(item[1].shape);
        // cell = row.insertCell( 4 );
        // cell.innerHTML = highlightHTML(item[1].hint);
        
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
        function read_row(row: HTMLTableRowElement, content: any, columns: string[], idx: number, deleted?: boolean) {
        let cell: HTMLTableDataCellElement;
        for (let [j, col] of columns.entries()) {
            cell = row.insertCell(j + 1);
            if (typeof content[col][idx] == "string") 
                cell.innerHTML = escapeHTML(content[col][idx]);
            else
                cell.innerHTML = escapeHTML(JSON.stringify(content[col][idx]));
            if (col.endsWith("-[auto]") || deleted) {
                cell.innerHTML = `<s>${cell.innerHTML}</s>`;
                cell.addEventListener("click", function(this) {
                    if (this.innerHTML.startsWith('<s>')) {
                        this.innerHTML = this.innerHTML.slice(3,-4);
                    } else {
                        this.innerHTML = `<s>${this.innerHTML}</s>`;
                    }
                });
            }
            else if (col.endsWith("[auto]")) {
                cell.innerHTML = `<b>${cell.innerHTML}</b>`;
                if (col.endsWith("*[auto]")) {
                    cell.innerHTML = cell.innerHTML.replace("-&gt;", `<i class="fas fa-arrow-right"></i>`);
                }
            }
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
            let col = columns[i];
            cell1.innerHTML = col;
            if (columns[i].endsWith('[auto]')) {
                cell1.innerHTML = col.slice(0,-7);
                col = col.slice(0, -6);
                cell1.appendChild(document.createElement("br"));
                let icon = document.createElement("i");
                icon.style.cursor = "pointer";
                if (col.endsWith("-")) {
                    icon.className = "fas fa-minus"
                    icon.title = "removed column";
                    cell1.appendChild(icon);
                }
                else if (col.endsWith("+")) {
                    icon.className = "fas fa-plus"
                    icon.title = "added column";
                    cell1.appendChild(icon);
                }
                else if (col.endsWith("*")) {
                    icon.className = "fas fa-star-of-life"
                    icon.title = "changed column";
                    cell1.appendChild(icon);
                }
                else if (col.endsWith(">")) {
                    icon.className = "fas fa-eye"
                    icon.title = "read column";
                    cell1.appendChild(icon);
                }
            }
                        
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
        function createButton(text="", icon="fa fa-caret-right") {
        let button = document.createElement("button");
        button.className = "btn";
        button.innerHTML = `<i class="${icon}"></i> ` + text;
        return button;
    }

    export
        function createSmallButton(icon:string, text="") {
        let button = document.createElement("button");
        button.className = "small-btn";
        button.innerHTML = `<i class="${icon}"></i> ` + text;
        return button;
    }

    export 
        function createText(text: string) {
        let ele = document.createElement( "p" );
        ele.className = "plain-text";
        // if (color == "")
        //     ele.style.cssText = `font-family:'verdana'`;
        // else
        //     ele.style.cssText = `font-family:'verdana';color:${color};`;
        ele.innerHTML = text;
        // ele.appendChild(document.createElement("br"))
        return ele;
    }
}
