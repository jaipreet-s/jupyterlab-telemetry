// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';

import '../style/index.css';

import { EventLog } from "./eventlog";

/**
 * Initialization data for the jupyterlab-telemetry extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-telemetry',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const el = new EventLog({
      handlers: [consoleHandler, consoleHandler2],
      allowedSchemas: ['org.jupyter.foo', 'org.jupyterlab.commands.docmanager:open'],
      commandRegistry: app.commands,
      commandEmitIntervalSeconds: 2
    })
    el.recordEvent({
      schema: 'org.jupyter.foo',
      version: 1,
      body: {
        'foo': 'bar'
      }
    });
    el.dispose();
  }
};

function consoleHandler(el: EventLog, events: EventLog.RecordedEvent[]) {
  console.log(`[Handler1] Received events ${JSON.stringify(events)}`)
}

function consoleHandler2(el: EventLog, events: EventLog.RecordedEvent[]) {
  console.log(`[Handler2] Received events ${JSON.stringify(events)}`)
}

export default extension;
