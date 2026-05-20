export default async function handler(req, res) {
  // Sadece POST isteği kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST destekleniyor' });
  }

  // CORS — GitHub Pages'den gelen isteklere izin ver
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mesaj boş olamaz' });
  }

  // PDF içeriği — proje bilgileri
  const PROJECT_CONTEXT = `
Aşağıda TÜBİTAK 4006 kapsamında yapılmış bir lise öğrenci projesinin tam içeriği yer almaktadır.
Bu, soruları yanıtlarken ÖNCE başvurman gereken ANA KAYNAKTIR.

=== PROJE BELGESİ ===

Proje Adı: MISIR KOÇANININ ATIK SULARDAKİ KROM GİDERİMİNDE KULLANIMI
Proje Türü: Araştırma | Proje Alanı: Kimya | Tematik Konu: Çevre ve Çevreyi Koruma

Görevli Öğrenciler: Rabia ÇAKIR, Derin Elif BUDAY, Mert Ali YILMAZ, Emirhan SÖZER
Danışman Öğretmenler: Levent GÜMÜŞ, Hamit BOLAT

PROBLEM / SORU CÜMLESİ:
Çevresel sorunların ortadan kalkmasına yarayacak kolay ve ekonomik yollar bulunabilir mi?

ÖZET:
İnsanoğlu, çevresel sorunların ortadan kalkmasına yarayacak kolay ve ekonomik yollar bulmaya çalışmaktadır.
Ekstraksiyon, iyon değiştirme, birlikte çöktürme ve adsorpsiyon gibi konvansiyonel yöntemler, radyoaktif elementler
ve iz metallerin konsantre edilmesi için kullanılmaktadır. Atık sulardaki ağır metal iyonlarının giderilmesinde
kimyasal çöktürme yöntemi yaygın olarak kullanılmaktadır. Ancak bu yöntemle arıtılan atık sulardaki ağır metal
iyonları konsantrasyonu deşarj standartlarını sağlamamaktadır.

YÖNTEM:
Mısır koçanı, yüksek selülozik yapısı ve adsorban (tutucu) özellikleri sayesinde su kirliliğini önlemede doğal,
ekonomik ve etkili bir malzeme olarak öne çıkmaktadır. Özellikle ham petrol gibi ağır kirlilikleri ve nehirlerdeki
kimyasal kirliliği temizlemek için kullanılan, biyokömür (biochar) veya filtre malzemesi olarak işlenen
sürdürülebilir bir çözümdür.

BULGULAR:
Çalışmada kullanılan mısır koçanı küçük tanecik boyutu haline getirilmiştir. Üzüm çöpünden elde edilen aktif karbon
ile krom adsorpsiyonu için 0,025 M Potasyum dikromat çözeltisi kullanılmıştır. Toz haline getirilmiş mısır
koçanından 0,5 g alınarak 50 mL, 0,025 M Potasyum dikromat çözeltisi içinde 8 saat ile 24 saat arasında süreyle
oda koşullarında Batch yöntemiyle çalışılmıştır. Bekletilen karışımdan mavi bant süzgeç kağıdı yardımıyla mısır
koçanı ayrılmıştır. Deney sonuçlarında kromun belirli miktarının adsorplandığı gözleme dayalı olarak bulunmuştur.
Adsorpsiyon öncesi çözelti koyu turuncu, sonrasında açık sarı renge dönmüştür.

SONUÇ VE TARTIŞMA:
Yapılan deneyler sadece renk değişiminin gözlenmesine dayalı olarak sonuçlandırılmıştır. Yapılan denemeler ve
incelenen literatürlerden mısır koçanının sulardan ağır metallerin ve organik kirliliklerden uzaklaştırılmasında
iyi bir adsorban olarak kullanılabileceği bulunmuştur. Bölgede bolca bulunan ve genellikle hayvan yemi ya da
yakılarak değerlendirilen bu malzemenin atık havuzlarında havuz diplerine yerleştirilip, organik kirlilikleri
gidererek suların temizlenmesine faydası olacağı görünmektedir. Yapılan çalışmanın özellikle aletsel denemelerle
daha da geliştirilebileceği açıktır.

KAYNAKÇA:
1. Erol Nalbur, B., Karaelli, E., "Petrol İçeren Atık Suların Arıtılabilirliği Ve Arıtım Sisteminin Tasarlanması",
   Uludağ Univ. J. Fac. Eng., (2019), 24, 231-242.
2. Akikol, İ., "Farklı aktivasyon yöntemleriyle geliştirilen aktif karbonlar ile sudan ağır metal giderimi",
   YTÜ Fen Bilimleri Enstitüsü Yüksek Lisans Tezi.

=== PROJE BELGESİ SONU ===
`;

  const SYSTEM_PROMPT = `Sen TÜBİTAK 4006 kapsamında yapılmış bir lise öğrenci projesinin yapay zeka asistanısın.

${PROJECT_CONTEXT}

CEVAP KURALLARIN:
1. Bir soru sorulduğunda ÖNCE yukarıdaki proje belgesine bak.
2. Cevap proje belgesinde varsa: "Projemize göre..." veya "Proje belgemizde..." diyerek oradan yanıtla.
3. Cevap proje belgesinde yoksa: Kimya, çevre bilimi veya adsorpsiyon konularında genel bilginle yanıtla. Bu durumda "Proje belgemizde bu konuya dair doğrudan bilgi bulunmuyor, ancak genel olarak..." diye başla.
4. Her zaman Türkçe yanıt ver.
5. Kısa, anlaşılır ve lise düzeyinde açıkla.
6. Gerekmedikçe teknik jargon kullanma, kullanırsan açıkla.`;

  // Konuşma geçmişini hazırla
  const conversationMessages = [];

  if (history && Array.isArray(history)) {
    history.forEach(msg => {
      conversationMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
  }

  // Yeni mesajı ekle
  conversationMessages.push({ role: 'user', content: message });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: conversationMessages
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    return res.status(200).json({
      reply: data.content[0].text
    });

  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
}
