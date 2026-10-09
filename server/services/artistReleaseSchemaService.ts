type ArtistReleaseSchemaDb = { execute: (...args: any[]) => Promise<any> };
let readyChecks = new WeakMap<ArtistReleaseSchemaDb, Promise<void>>();
const DISCLOSURE_COLUMNS = [
  {name:'aiUseDisclosureEnabled',definition:'`aiUseDisclosureEnabled` boolean DEFAULT false NOT NULL'},
  {name:'aiUseLevel',definition:'`aiUseLevel` varchar(40)'},
  {name:'aiUseComponents',definition:'`aiUseComponents` json'},
  {name:'aiUseTools',definition:'`aiUseTools` varchar(300)'},
  {name:'aiUseNotes',definition:'`aiUseNotes` varchar(1000)'},
] as const;

/** Inspect first: MySQL/TiDB do not accept ADD COLUMN IF NOT EXISTS.
 * Only repair the five already-defined optional fields; never change release rows.
 */
export function ensureArtistReleaseDisclosureSchema(db: ArtistReleaseSchemaDb): Promise<void> {
  const existing=readyChecks.get(db);
  if(existing) return existing;
  const check=(async()=>{
    const [rows]=await db.execute('SHOW COLUMNS FROM `artist_releases`');
    if(!Array.isArray(rows)) throw new Error('Could not inspect Music Release schema');
    const columns=new Set(rows.map(row=>String(row.Field??row.field)));
    for(const column of DISCLOSURE_COLUMNS){
      if(columns.has(column.name))continue;
      try {await db.execute(`ALTER TABLE \`artist_releases\` ADD COLUMN ${column.definition}`);}
      catch(error:any){if((error?.code??error?.cause?.code)!=='ER_DUP_FIELDNAME')throw error;}
    }
  })().catch(error=>{readyChecks.delete(db);throw error;});
  readyChecks.set(db,check);return check;
}
export function resetArtistReleaseDisclosureSchemaForTests(){readyChecks=new WeakMap();}
