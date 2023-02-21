import { Managed, traceManager } from "@flarenetwork/mcc";
import fs from "fs";
import { stringify } from "safe-stable-stringify";
import { readConfig } from "../utils/config/config";
import { sleepms } from "../utils/helpers/utils";
import { AttLogger, getGlobalLogger, logException } from "../utils/logging/logger";
import { Terminal } from "../utils/monitoring/Terminal";
import { AttesterMonitor } from "./AttestationMonitor";
import { DatabaseMonitor } from "./DatabaseMonitor";
import { DockerMonitor } from "./DockerMonitor";
import { IndexerMonitor } from "./IndexerMonitor";
import { MonitorBase, MonitorRestartConfig } from "./MonitorBase";
import { MonitorConfig } from "./MonitorConfiguration";
import { NodeMonitor } from "./NodeMonitor";
import { WebserverMonitor } from "./WebserverMonitor";

@Managed()
export class MonitorManager {
  logger: AttLogger;
  config: MonitorConfig;

  monitors: MonitorBase[] = [];

  constructor() {
    this.logger = getGlobalLogger();

    this.config = readConfig(new MonitorConfig(), "monitor");

    for (const node of this.config.nodes) {
      this.monitors.push(new NodeMonitor(node, this.logger, this.config));
    }

    for (const docker of this.config.dockers) {
      this.monitors.push(new DockerMonitor(docker, this.logger, this.config));
    }

    for (const indexer of this.config.indexers) {
      this.monitors.push(new IndexerMonitor(indexer, this.logger, this.config));
    }

    for (const attester of this.config.attesters) {
      this.monitors.push(
        new AttesterMonitor(attester.name, this.logger, attester.mode, attester.path, new MonitorRestartConfig(this.config.timeRestart, attester.restart))
      );
    }

    for (const backend of this.config.backends) {
      this.monitors.push(new WebserverMonitor(backend.name, this.logger, new MonitorRestartConfig(this.config.timeRestart, backend.restart), backend.address));
    }

    for (const database of this.config.databases) {
      this.monitors.push(new DatabaseMonitor(database.name, this.logger, database.database, database.connection));
    }
  }

  async runMonitor() {
    traceManager.displayStateOnException = false;
    traceManager.displayRuntimeTrace = false;

    for (const alert of this.monitors) {
      await alert.initialize();
    }

    const terminal = new Terminal(process.stderr);
    //terminal.cursor(false);

    this.logger.info(`^e^K${"type".padEnd(20)}  ${"name".padEnd(20)}  ${"status".padEnd(10)}    ${"message".padEnd(10)} comment                        `);

    terminal.cursorSave();

    while (true) {
      try {
        terminal.cursorRestore();

        const statusAlerts = [];
        const statusPerfs = [];

        for (const alert of this.monitors) {
          try {
            const resAlert = await alert.check();

            if (!resAlert) continue;

            statusAlerts.push(resAlert);

            resAlert.displayStatus(this.logger);
          } catch (error) {
            logException(error, `alert ${alert.name}`);
          }
        }

        for (const alert of this.monitors) {
          try {
            const resPerfs = await alert.perf();

            if (!resPerfs) continue;

            for (const perf of resPerfs) {
              statusPerfs.push(perf);
              perf.displayStatus(this.logger);
            }
          } catch (error) {
            logException(error, `perf ${alert.name}`);
          }
        }

        if (this.config.stateSaveFilename) {
          try {
            fs.writeFile(this.config.stateSaveFilename, stringify({ alerts: statusAlerts, perf: statusPerfs }), function (err) {
              if (err) {
                this.logger.error(err);
              }
            });
          } catch (error) {
            logException(error, `save state`);
          }
        }
      } catch (error) {
        logException(error, `runAlerts`);
      }

      await sleepms(this.config.interval);
    }
  }
}