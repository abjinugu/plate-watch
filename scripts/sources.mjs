// Source adapters. Each returns an array of normalized entries (see schema.mjs).
//
// These are STUBS on purpose. For a solo, $0 project the reliable path is
// semi-manual curation of data/entries.json, so live scraping is optional and
// each adapter documents the real approach and why it's non-trivial. Fill one
// in when you're ready; ingest.mjs will merge whatever they return.

// FSSAI Hygiene Rating register.
// The public portal (hygiene.fssai.gov.in/knowRating.php) is a single-record
// lookup form, not a bulk API, and there is no list-by-city endpoint. A real
// adapter would POST known FBO identifiers and parse the returned HTML, so you
// must supply the FBO list yourself. Returns [] until implemented.
export async function fromFssai() {
  return []
}

// Commissioner of Food Safety, Telangana (@cfs_telangana) enforcement posts.
// X's API is paywalled and scraping it violates the ToS, so the dependable
// option here is to read the feed and add entries to data/entries.json by hand.
// If you later add an RSS bridge or a paid source, parse it in this function.
export async function fromCfsTelangana() {
  return []
}

// GHMC drives, which surface in press coverage (NewsMeter, Siasat, TOI).
// An adapter could fetch a maintained set of article URLs and extract findings
// with a parser (or an LLM pass), then normalize to the schema. Returns [] for now.
export async function fromGhmc() {
  return []
}
