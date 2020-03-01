.. webcomp-plugin documentation master file, created by
   sphinx-quickstart on Sun Mar  1 17:59:38 2020.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Webcomp-plugin: Web component frontend to the Pythia framework
==============================================================

Pythia is a framework deployed as an online platform whose goal is to teach programming and algorithm design. The platform executes the code in a safe environment and its main advantage is to provide intelligent feedback to its users to suppor their learning. More details about the whole project can be found on the `official website of Pythia
<https://www.pythia-project.org/>`_.

Webcomp-plugin defines the `pythia-task-executor` web component frontend to the Pythia framework. It makes it possible to embed a form to execute a Pythia task and display the execution result.



Quick install
-------------

The webcomp-plugin web component can be built on Linux, Windows and macOS.

Start by installing required dependencies:

* Node.js (v12)

Then, clone the Git repository, and launch the installation:

.. code-block:: none

   > git clone https://github.com/pythia-project/webcomp-plugin.git
   > cd webcomp-plugin
   > npm install

Once successfully installed, you can launch a test server showing the web component in a web page:

.. code-block:: none

   > npm run serve

You can now browse to the `http://localhost:8081
<http://localhost:8081>`_ page (or the one indicated in your console if the port differs) to see the web component in action. It is configured to run the `execute-python` task with the pre-filled code. If you have the `Pythia framework
<https://pythia-core.readthedocs.io>`_ and the `pythia-server
<https://pythia-server.readthedocs.io>`_ running on your machine, you can press the `Submit` button to run the task. You will then see the following result appearing on the web page:

.. code-block:: none

   { "returncode": 0, "stderr": "", "stdout": "Hello World!" }
