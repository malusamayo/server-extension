# Server Extension for WrangleDoc

This is a jupyterlab extension that renders generated documentation from notebook analysis engine.

## Installing the Package

```bash
# Install the server extension and
# copy the frontend extension where JupyterLab can find it
pip install jlab_ext_example
```

As developer, you might want to install the package in local editable mode.
This will shunt the installation machinery described above. Therefore the commands
to get you set are:

```bash
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm run build
```
<!-- prettier-ignore-end -->
