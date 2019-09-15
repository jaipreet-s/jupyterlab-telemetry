import { Signal, Slot } from "@phosphor/signaling";
import { CommandRegistry } from "@phosphor/commands";

export class EventLog {
    private readonly handlers: Slot<EventLog, EventLog.Event[]>[];
    private readonly allowedSchemas: string[];
    private readonly eventSignal: Signal<EventLog, EventLog.Event[]>
    private readonly commandLog: EventLog.Event[]

    constructor(options: EventLog.IOptions) {
        this.handlers = options.handlers;
        this.allowedSchemas = options.allowedSchemas
        this.eventSignal = new Signal(this)
        this.commandLog = []

        for (const handler of this.handlers) {
            this.eventSignal.connect(handler);
        }

        if (options.commandRegistry !== undefined) {
            this.enableCommandEvents(options);
        } else {
            console.log(`No commandRegistry provided. Not publishing JupyterLab command events.`)
        }
    }

    /**
     * The interface for event publishers to record a single event.
     * 
     * - Validate that the event schema is whitelisted
     * - Validate that the event schema is valid
     * - Emit the event to the configured handlers.
     * @param event the event to record
     */
    public recordEvent(event: EventLog.Event): Promise<void> {
        if (!this.isSchemaWhitelisted(event.schema)) {
            return;
        }

        if (!this.isSchemaValid(event)) {
            return;
        }

        // TODO: Add event "capsule"
        this.eventSignal.emit([event])
    }

    /**
     * TODO: Implement schema validation. 
     */
    private isSchemaValid(event: EventLog.Event): boolean {
        return true
    }

    /**
     * TODO: Make this configurable via Settings Registry
     */
    private isSchemaWhitelisted(eventSchema: string): boolean {
        let isWhitelisted =  this.allowedSchemas.indexOf(eventSchema) > -1;
        console.log(`Schema ${eventSchema} is whitelited: ${isWhitelisted}`)
        return isWhitelisted;
    }

    /**
    * Subscribe the EventLog instance to all command executions in the JupyterLab application.
    *
    * Batches command events in-memory before emitting to each event handler.
    *
    * @param options the EventLog instantiation options.
    */
    private enableCommandEvents(options: EventLog.IOptions) {
        options.commandRegistry.commandExecuted.connect((registry, command) => {
            const commandEventSchema = `org.jupyterlab.commands.${command.id}`;
            if (this.isSchemaWhitelisted(commandEventSchema)) {
                this.commandLog.push({
                    schema: `org.jupyterlab.commands.${command.id}`,
                    body: command.args,
                    version: 1
                });
            }
        });
        const saveLog = () => {
            if (this.commandLog.length === 0) {
                return;
            }
            const outgoing = this.commandLog.splice(0);
            this.eventSignal.emit(outgoing)
        };
        setInterval(saveLog, options.commandEmitIntervalSeconds !== undefined ? options.commandEmitIntervalSeconds * 1000 : 120 * 1000);
    }
}

/**
 * 
 * A namespace for `EventLog` methods.
 */
export namespace EventLog {
    /**
     * The instantiation options for an EventLog
     */
    export interface IOptions {
        /**
         * The list of schema IDs to whitelist for the EventLog instance.
         */
        allowedSchemas: string[],

        /**
         * The list of event handlers to subscribe to the EventLog instance
         */
        handlers: Slot<EventLog, EventLog.Event[]>[],

        /**
         * The `CommandRegistry` instance from the JupyterLab application. 
         * If provided, this causes the EventLog to subscribe to JupyterLab command executions and 
         * emit events to the provided handlers.
         * 
         * Individual commands still need to be whitelisted using the `org.jupyterlab.commands.$COMMAND_ID` schema ID.
         */
        commandRegistry?: CommandRegistry,

        /**
         * The interval, in seconds, for which JupyterLab command events are batched in-memory before being emitted
         * to the provided handlers.
         * 
         * If not provided, the default interval is 120 seconds (2 minutes).
         */
        commandEmitIntervalSeconds?: number
    }

    /**
     * The model to represent an event.
     * The event body needs to conform to the given schema.
     */
    export interface Event {
        schema: string,
        version: number,
        body: any
    }
}