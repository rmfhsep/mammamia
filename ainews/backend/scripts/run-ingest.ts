import { ingestAllSources } from "../modules/ingest/ingest.service";

ingestAllSources()
  .then((results) => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
