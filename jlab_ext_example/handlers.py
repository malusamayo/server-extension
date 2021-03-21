import os, subprocess
import json
import re

from notebook.base.handlers import APIHandler
from notebook.utils import url_path_join

import tornado
from tornado.web import StaticFileHandler

script_path = "C:\\Users\\77338\\Documents\\GitHub\\notebooks-analysis"

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({"data": "This is /jlab-ext-example/hello endpoint!"}))

    @tornado.web.authenticated
    def post(self):
        # input_data is a dictionary with a key "path"
        input_data = self.get_json_body()
        # jupyterlab directory
        cwd = os.getcwd()
        data = {"cwd": cwd}
        if input_data["command"] == "run":
            if input_data["path"].endswith(".ipynb"):
                command = ""
                try:
                    abs_data_path = os.path.abspath(input_data['path'])
                    print(abs_data_path)
                    os.chdir(script_path)
                    command = " ".join(["python", "run.py", abs_data_path])
                    ret_code = os.system(command)
                    os.chdir(cwd)
                    print(ret_code)
                    if ret_code == 0:
                        data["msg"] = "Successfully run AutoDoc!"
                    elif ret_code == -1:
                        data["msg"] = "Oops! Error when executing the notebook."
                    elif ret_code == -2:
                        data["msg"] = "Oops! Error with static analysis."
                    elif ret_code == -3:
                        data["msg"] = "Oops! Error with dynamic analysis."
                    elif ret_code == -4:
                        data["msg"] = "Oops! Error with synthesis."
                    elif ret_code == -5:
                        data["msg"] = "Oops! Error with notebook conversion."
                    else:
                        data["msg"] = "Oops! Something went wrong."
                except:
                    data["msg"] = "error when executing: " + command
        elif input_data["command"] == "fetch":
            if input_data["path"].endswith(".ipynb"):
                cell_idx = str(input_data["cell"])
                path = os.path.join(".", input_data["path"][:-6], f"result_{cell_idx}.json")
                try:
                    with open(path, 'r') as j:
                        data = json.loads(j.read())
                except FileNotFoundError:
                    data["msg"] = "no generated info for cell: " + cell_idx
                    # data["msg"] = "File not found: " + path
                print("fetching data finished")
        self.finish(json.dumps(data))


def setup_handlers(web_app, url_path):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    # Prepend the base_url so that it works in a JupyterHub setting
    route_pattern = url_path_join(base_url, url_path, "hello")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Prepend the base_url so that it works in a JupyterHub setting
    doc_url = url_path_join(base_url, url_path, "public")
    doc_dir = os.getenv(
        "JLAB_SERVER_EXAMPLE_STATIC_DIR",
        os.path.join(os.path.dirname(__file__), "public"),
    )
    handlers = [("{}/(.*)".format(doc_url), StaticFileHandler, {"path": doc_dir})]
    web_app.add_handlers(".*$", handlers)
