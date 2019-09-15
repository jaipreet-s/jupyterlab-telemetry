import { Signal, Slot } from "@phosphor/signaling";
import { CommandRegistry } from "@phosphor/commands";

export class EventLog {
    readonly handlers: Slot<EventLog, EventLog.Event[]>[];
    readonly allowedSchemas: string[];
    readonly eventSignal: Signal<EventLog, EventLog.Event[]>
    readonly commandLog: EventLog.Event[]

    constructor(options: EventLog.IOptions) {
        this.handlers = options.handlers;
        this.allowedSchemas = options.allowedSchemas
        this.eventSignal = new Signal(this)
        this.commandLog = []

        // Register all handlers
        for (const handler of this.handlers) {
            this.eventSignal.connect(handler);
        }

        // Subcribe to JL events and publish to configured handlers
        if (options.commandRegistry !== undefined) {
            options.commandRegistry.commandExecuted.connect((registry, command) => {
                this.commandLog.push({
                    schema: `org.jupyterlab.commands.${command.id}`,
                    body: command.args,
                    version: 1
                });
            });

            const saveLog = () => {
                if (this.commandLog.length === 0) {
                    return;
                }
                const outgoing = this.commandLog.splice(0);
                this.eventSignal.emit(outgoing)
            };

            // Emit the command events as configured.
            setInterval(saveLog, options.commandEmitIntervalSeconds !== undefined ? options.commandEmitIntervalSeconds * 1000 : 120 * 1000);
        } else {
            console.log(`No commandRegistry provided. Not publishing JupyterLab command events.`)
        }
    }

    /**
     * Record a single event
     * - Validate that the event schema is whitelisted
     * - Validate that the event schema is valid
     * - Emit the event 
     * @param event the event to record
     */
    public recordEvent(event: EventLog.Event): Promise<void> {
        if (!this.isSchemaWhitelisted(event)) {
            return;
        }

        if (!this.isSchemaValid(event)) {
            return;
        }

        // TODO: Add event "capsule"
        this.eventSignal.emit([event])
    }

    /**
     * TODO: Validate schema
     * @param event 
     */
    private isSchemaValid(event: EventLog.Event) {
        return true
    }

    /**
     * TODO: Make this configurable via configuration
     */
    private isSchemaWhitelisted(event: EventLog.Event) {
        return true;
    }
}

/**
 * 
 * A namespace for `EventLog` statics.
 */
export namespace EventLog {
    /**
     * The instantiation options for an EventLog
     */
    export interface IOptions {
        allowedSchemas: string[],
        handlers: Slot<EventLog, EventLog.Event[]>[],
        commandRegistry?: CommandRegistry,
        commandEmitIntervalSeconds?: number
    }

    /**
     * 
     */
    export interface Event {
        schema: string,
        version: number,
        body: any
    }
}