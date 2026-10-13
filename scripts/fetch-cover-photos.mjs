import { readFile, writeFile } from 'node:fs/promises';

const CLOUD_NAME = 'lgk3ljrv';
const UPLOAD_PRESET = 'gezgin-checkin';
const USER_AGENT = 'GezginRotalar/1.0 (https://github.com/deryakaya06/gezgin-rotalar)';

// Wikipedia'da başlığı mekan adından farklı olanlar.
const WIKI_TITLES = {
  'balat': 'Balat, Fatih',
  'bebek-sahili': 'Bebek, Beşiktaş',
  'moda-sahili': 'Moda, Kadıköy',
  'kadikoy-carsi': 'Kadıköy',
  'yeldegirmeni': 'Yeldeğirmeni, Kadıköy',
  'camlica-tepesi': 'Büyük Çamlıca Tepesi',
};

// Arama yanlış sonuç verdiğinde elle seçilmiş Commons dosyası.
const COMMONS_FILES = {
  'pera-muzesi': 'Istanbul Beyoglu Pera museum.jpg',
  'moda-sahili': 'Moda Park - panoramio.jpg',
  'camlica-tepesi': 'Çamlıca Hill public park.jpg',
};

// Wikipedia'nın ana görseli kapak için uygun olmayanlarda (logo, harita, kolaj)
// Commons'ta yapılacak arama.
const COMMONS_QUERIES = {
  'emirgan-korusu': 'Emirgan Park tulips Istanbul',
  'yeldegirmeni': 'Yeldeğirmeni Kadıköy street',
  'kadikoy-carsi': 'Kadıköy market street',
  // Karaköy şubesinin serbest lisanslı fotoğrafı yok; mekanın ünlü olduğu tatlı gösterilir.
  'karakoy-gulluoglu': 'Turkish baklava pistachio',
};

/** Logo, harita, ikon ve kolajlar kapak fotoğrafı olamaz. */
const isPhoto = (file) => /\.(jpe?g)$/i.test(file) && !/logo|map|location|collage|\dimg/i.test(file);

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = args.has('--force');
const file = new URL('./locations.json', import.meta.url);

async function wikiJson(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${host} ${res.status}`);
  return res.json();
}

/** Makalenin serbest lisanslı ana görselinin dosya adı (pageimages varsayılanı yalnızca serbest görsel döndürür). */
async function leadImage(lang, title) {
  const json = await wikiJson(`${lang}.wikipedia.org`, {
    action: 'query', titles: title, redirects: '1', prop: 'pageimages', piprop: 'name',
  });
  const page = json.query?.pages?.[0];
  return page && !page.missing && page.pageimage ? { file: page.pageimage, article: page.title, lang } : null;
}

const stripHtml = (s = '') => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/** Commons dosya aramasında ilk uygun fotoğraf. */
async function commonsSearch(query) {
  const json = await wikiJson('commons.wikimedia.org', {
    action: 'query', list: 'search', srsearch: `${query} filetype:bitmap`, srnamespace: '6', srlimit: '15',
  });
  const hit = (json.query?.search ?? []).map((r) => r.title.replace(/^File:/, '')).find(isPhoto);
  return hit ? { file: hit } : null;
}

/** Commons'tan 1600 px kopyanın adresi ve künye bilgisi. */
async function imageInfo(fileName) {
  const json = await wikiJson('commons.wikimedia.org', {
    action: 'query', titles: `File:${fileName}`, prop: 'imageinfo',
    iiprop: 'url|user|extmetadata', iiurlwidth: '1600',
  });
  const info = json.query?.pages?.[0]?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata ?? {};
  return {
    url: info.thumburl ?? info.url,
    // Fotoğrafçı alanı boşsa yükleyen kişi yazılır.
    author: stripHtml(meta.Artist?.value) || info.user || 'Bilinmiyor',
    license: stripHtml(meta.LicenseShortName?.value) || 'Bilinmiyor',
    sourceUrl: info.descriptionurl,
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Wikimedia çok sık istekte 429 döndürür; birkaç kez bekleyip yeniden dener. */
async function uploadToCloudinary(remoteUrl, attempt = 1) {
  try {
    return await uploadOnce(remoteUrl);
  } catch (error) {
    if (attempt >= 4 || !/429/.test(error.message)) throw error;
    await sleep(attempt * 5000);
    return uploadToCloudinary(remoteUrl, attempt + 1);
  }
}

/**
 * Görseli Wikimedia'nın istediği User-Agent ile kendimiz indirip base64 olarak yükleriz;
 * Cloudinary'nin kendi indiricisi orijinal dosyalarda 429 alıyor.
 */
async function uploadOnce(remoteUrl) {
  const image = await fetch(remoteUrl, { headers: { 'User-Agent': USER_AGENT } });
  if (!image.ok) throw new Error(`Wikimedia ${image.status}`);
  const type = image.headers.get('content-type') ?? 'image/jpeg';
  const base64 = Buffer.from(await image.arrayBuffer()).toString('base64');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: `data:${type};base64,${base64}`, upload_preset: UPLOAD_PRESET }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Cloudinary ${res.status}`);
  return json.secure_url;
}

const locations = JSON.parse(await readFile(file, 'utf8'));
let found = 0;
const missing = [];

for (const location of locations) {
  if (location.coverPhotoUrl && !force) {
    found++;
    continue;
  }
  const title = WIKI_TITLES[location.id] ?? location.name;
  try {
    let lead = COMMONS_FILES[location.id]
      ? { file: COMMONS_FILES[location.id] }
      : COMMONS_QUERIES[location.id]
      ? null
      : (await leadImage('tr', title)) ?? (await leadImage('en', title));
    if (!lead || !isPhoto(lead.file)) {
      lead = await commonsSearch(COMMONS_QUERIES[location.id] ?? `${location.name} İstanbul`);
    }
    const info = lead && (await imageInfo(lead.file));
    if (!info) {
      missing.push(location.name);
      console.log(`– ${location.name}: serbest lisanslı görsel bulunamadı`);
      continue;
    }
    console.log(`✔ ${location.name}: ${lead.file} (${info.license}, ${info.author.slice(0, 40)})`);
    if (dryRun) {
      found++;
      continue;
    }

    location.coverPhotoUrl = await uploadToCloudinary(info.url);
    found++;
    await sleep(1500);
    location.coverPhotoCredit = `${info.author} · ${info.license}`.slice(0, 200);
    location.coverPhotoSource = info.sourceUrl;
  } catch (error) {
    missing.push(location.name);
    console.log(`✖ ${location.name}: ${error.message}`);
  }
}

if (!dryRun) await writeFile(file, JSON.stringify(locations, null, 2) + '\n');
console.log(`\n${found}/${locations.length} mekanın kapak fotoğrafı var.` + (missing.length ? ` Eksik: ${missing.join(', ')}` : ''));
