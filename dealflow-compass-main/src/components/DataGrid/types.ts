export type ColumnFormat = "tags" | "text" | "scoring" | "number" | "date";
export type DataSource = "manual" | "ai";

export interface DynamicColumn {
  id: string;
  title: string;
  dataSource: DataSource;
  format: ColumnFormat;
  aiPrompt?: string;
}

export interface Company {
  id: number;
  name: string;
  city: string;
  employees: string;
  description: string;
  revenue: string;
  ebitda: string;
  score: number;
  status: string;
  url: string;
  [key: string]: string | number | boolean | undefined;
}

export const mockData: Company[] = [
  { id: 1, name: "BODEGAS PIQUERAS S.A.", city: "Almansa", employees: "15", description: "Elaboración y comercialización de vinos...", revenue: "9.7M €", ebitda: "2.1M €", score: 7.0, status: "Discarded", url: "www.bodegaspiqueras.com" },
  { id: 2, name: "SAT COLOMAN 3753", city: "Pedro Muñoz", employees: "12", description: "Elaboración y crianza de vinos...", revenue: "9.7M €", ebitda: "0.3M €", score: 3.1, status: "Shortlist", url: "www.satcoloman.com" },
  { id: 3, name: "BODEGAS PEÑASCAL SL.", city: "Laguna De Duero", employees: "26", description: "Explotación de los negocios de vinos...", revenue: "9.4M €", ebitda: "0.6M €", score: 2.7, status: "Meeting Scheduled", url: "www.bodegaspenascal.es" },
  { id: 4, name: "SELECCION DE TORRES SL", city: "Fompedraza", employees: "16", description: "Elaboracion y distribucion de vinos...", revenue: "9.4M €", ebitda: "1.6M €", score: 5.5, status: "Shortlist", url: "www.torres.es" },
  { id: 5, name: "COOP SAN JUAN BAUTISTA", city: "Fuendejalon", employees: "16", description: "Elaboración de vinos en general...", revenue: "9.2M €", ebitda: "0.5M €", score: 8.8, status: "Discarded", url: "www.coopfuendejalon.com" },
  { id: 6, name: "CELLERS MOST DORE S.L.", city: "Sant Sadurni D'Anoia", employees: "42", description: "Elaboración y comercialización de vinos...", revenue: "9.1M €", ebitda: "1.0M €", score: 9.4, status: "Pending", url: "www.montesquius.com" },
  { id: 7, name: "BODEGAS DON QUIJOTE SA.", city: "Madrid", employees: "8", description: "Elaboración de vinos al granel...", revenue: "9.0M €", ebitda: "0.7M €", score: 4.8, status: "Shortlist", url: "www.donquijotebodegas.com" },
  { id: 8, name: "BODEGAS Y VIÑEDOS PINTIA SA", city: "San Roman De Hornija", employees: "24", description: "Explotación de bodega...", revenue: "8.9M €", ebitda: "6.0M €", score: 6.8, status: "Shortlist", url: "www.temposvegasicilia.com" },
  { id: 9, name: "EMILIO LUSTAU SA", city: "Jerez De La Frontera", employees: "8", description: "Crianza y elaboración y de vinos...", revenue: "8.9M €", ebitda: "0.7M €", score: 8.4, status: "Contacted", url: "www.lustau.es" },
  { id: 10, name: "DOMINIO DE PINGUS SL", city: "Valbuena De Duero", employees: "18", description: "Comercialización y Elaboracion de vinos...", revenue: "8.8M €", ebitda: "5.4M €", score: 4.7, status: "Meeting Scheduled", url: "www.pingus.es" },
  { id: 11, name: "BODEGAS PORTIA SL", city: "Gumiel De Izan", employees: "22", description: "Explotacion de bodega...", revenue: "8.6M €", ebitda: "2.1M €", score: 4.5, status: "Discarded", url: "www.bodegasportia.com" },
  { id: 12, name: "BODEGAS LUZON SL", city: "Jumilla", employees: "43", description: "Elaboración y comercialización de vinos...", revenue: "8.5M €", ebitda: "1.1M €", score: 9.2, status: "Contacted", url: "www.bodegasluzon.com" },
  { id: 13, name: "BODEGAS IZADI S.A.", city: "Villabuena De Alava", employees: "19", description: "La sociedad tendrá por objeto: a) La explotación...", revenue: "8.5M €", ebitda: "2.5M €", score: 3.2, status: "Meeting Scheduled", url: "www.artevino.es" },
  { id: 14, name: "REAL SITIO DE VENTOSILLA", city: "Madrid", employees: "84", description: "Elaboración y comercialización de vinos...", revenue: "8.5M €", ebitda: "0.8M €", score: 6.6, status: "NDA Sent", url: "www.pradorey.es" },
  { id: 15, name: "BODEGA SOMMOS S.L.", city: "Barbastro", employees: "52", description: "Elaboración y comercialización de vinos...", revenue: "8.5M €", ebitda: "1.1M €", score: 7.4, status: "NDA Sent", url: "www.bodegasommos.com" },
  { id: 16, name: "BODEGAS MORALIA S.L.", city: "Moral De Calatrava", employees: "6", description: "Explotacion y Gestión de Bodega...", revenue: "8.5M €", ebitda: "0.2M €", score: 6.9, status: "NDA Sent", url: "www.bodegasmoralia.es" },
  { id: 17, name: "BODEGAS RODA SA", city: "Haro", employees: "37", description: "Crianza y elaboración de vinos...", revenue: "8.2M €", ebitda: "2.7M €", score: 4.5, status: "Discarded", url: "www.roda.es" },
  { id: 18, name: "BODEGAS BENJAMIN DE ROTHSCHILD", city: "Samaniego", employees: "23", description: "Gestión y explotación de bodega...", revenue: "8.2M €", ebitda: "3.1M €", score: 9.5, status: "Discarded", url: "www.macan-wine.com" },
  { id: 19, name: "COOP SAN ALEJANDRO", city: "Miedes De Aragon", employees: "23", description: "Cultivo,elaboración y crianza de vinos...", revenue: "8.1M €", ebitda: "0.7M €", score: 3.4, status: "Discarded", url: "www.san-alejandro.com" },
  { id: 20, name: "BODEGAS LOPEZ MORENAS SL", city: "Fuente Del Maestre", employees: "46", description: "Elaboración,crianza y comercialización...", revenue: "8.1M €", ebitda: "2.3M €", score: 5.5, status: "Contacted", url: "www.bodegaslopezmorenas.com" },
  { id: 21, name: "ALVARO PALACIOS SL", city: "Gratallops", employees: "12", description: "Elaboración de vino tinto...", revenue: "7.8M €", ebitda: "4.3M €", score: 9.3, status: "Meeting Scheduled", url: "www.alvaropalacios.com" },
  { id: 22, name: "BODEGAS VALDEMAR SA", city: "Oyon-Oion", employees: "25", description: "Elaboración, crianza, embotellado...", revenue: "7.8M €", ebitda: "1.3M €", score: 2.1, status: "Discarded", url: "www.valdemarfamily.com" },
  { id: 23, name: "BODEGAS COPABOCA SL", city: "Tordesillas", employees: "26", description: "Elaboración,crianza y comercialización...", revenue: "7.8M €", ebitda: "1.0M €", score: 3.2, status: "Meeting Scheduled", url: "www.copaboca.es" },
  { id: 24, name: "DIEZ SIGLOS DE VERDEJO SL", city: "Serrada", employees: "18", description: "Elaboración, crianza y comercialización...", revenue: "7.7M €", ebitda: "1.8M €", score: 2.9, status: "Shortlist", url: "www.diezsiglos.es" },
  { id: 25, name: "GRUPO VINICOLA MARQUES DE VARGAS", city: "Logroño", employees: "38", description: "Bodega de vinos, elaboración de vinos...", revenue: "7.7M €", ebitda: "1.4M €", score: 8.5, status: "Discarded", url: "www.marquesdevargas.com" },
  { id: 26, name: "BODEGAS MARQUES DE VIZHOJA SA", city: "Arbo", employees: "27", description: "Elaboración,crianza y comercialización...", revenue: "7.7M €", ebitda: "1.7M €", score: 8.4, status: "NDA Sent", url: "www.marquesdevizhoja.com" },
  { id: 27, name: "BODEGAS Y VIÑEDOS FONTANA SL", city: "Madrid", employees: "25", description: "Elaboración,crianza y comercialización...", revenue: "7.6M €", ebitda: "-0.9M €", score: 2.1, status: "Meeting Scheduled", url: "www.bodegasfontana.com" },
  { id: 28, name: "PEREZ BARQUERO SA", city: "Montilla", employees: "N/A", description: "Elaboración y crianza de vinos...", revenue: "7.6M €", ebitda: "0.7M €", score: 3.6, status: "Pending", url: "www.perezbarquero.com" },
  { id: 29, name: "BODEGAS HERMANOS TORRES", city: "Madrigueras", employees: "10", description: "Elaboración y venta de vino a granel...", revenue: "7.3M €", ebitda: "0.5M €", score: 7.7, status: "Pending", url: "www.vinosfuror.com" },
  { id: 30, name: "BODEGAS COSME PALACIO, S.A.", city: "Laguardia", employees: "25", description: "Elaboración y crianza de vinos...", revenue: "7.3M €", ebitda: "0.9M €", score: 9.0, status: "Contacted", url: "www.entrecanalesdomecq.com" },
  { id: 31, name: "BODEGAS CAMPILLO SL", city: "Laguardia", employees: "15", description: "Fabricación y distribución de vinos...", revenue: "7.1M €", ebitda: "2.3M €", score: 8.4, status: "Discarded", url: "www.visitabodegas.familiamartinezzabala.com" },
  { id: 32, name: "BODEGAS CARLOS SERRES S.L.", city: "Haro", employees: "12", description: "Exportación, crianza y elaboración...", revenue: "7.1M €", ebitda: "0.3M €", score: 4.2, status: "NDA Sent", url: "www.carlosserres.com" },
  { id: 33, name: "BODEGAS ALCEÑO SA.", city: "Jumilla", employees: "21", description: "Elaboración,crianza y comercialización...", revenue: "7.1M €", ebitda: "0.5M €", score: 4.5, status: "Discarded", url: "www.alceno.com" },
  { id: 34, name: "BODEGAS CEPA 21, SA", city: "Castrillo De Duero", employees: "30", description: "Elaboración y crianza de vinos tintos...", revenue: "7.1M €", ebitda: "1.3M €", score: 6.0, status: "Shortlist", url: "www.cepa21.com" },
  { id: 35, name: "CELLER CAN PAGES SL", city: "Sant Pere De Ribes", employees: "13", description: "PROMOCION DE TODO TIPO DE PLANTACIONES...", revenue: "7.0M €", ebitda: "0.7M €", score: 3.0, status: "Shortlist", url: "www.cellercanpages.es" },
];
