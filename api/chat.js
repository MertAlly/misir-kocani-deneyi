export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST destekleniyor' });
  }

  const { message, history, isSuggestion } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mesaj boş olamaz' });
  }

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

  // Öneri sorusu üretme isteği için ayrı sistem prompt'u
  const SUGGESTION_SYSTEM_PROMPT = `Sen bir eğitim asistanısın. Görevin, kullanıcının konuyu sıfırdan öğrenmesini sağlayacak sorular üretmek.

Proje konusu: Mısır koçanı kullanılarak atık sulardaki krom (VI) giderimi — TÜBİTAK 4006 lise projesi.

Konu başlıkları: adsorpsiyon, ağır metal kirliliği, selüloz yapısı, krom (Cr⁶⁺) toksisitesi, batch yöntemi, filtrasyon, çevre kimyası, sürdürülebilir malzemeler.

Kurallar:
- SADECE JSON dizisi döndür: ["soru1","soru2","soru3"]
- Başka hiçbir şey yazma, açıklama yapma
- Her soru kısa (max 10 kelime), merak uyandırıcı
- Sorular birbirinden farklı alt konulara değinsin
- Kullanıcıyı temel kavramlardan ileri konulara taşıyacak sorular sor
- Daha önce sorulmuş/önerilmiş soruları tekrarlama`;

  const SYSTEM_PROMPT = `Sen TÜBİTAK 4006 kapsamında yapılmış bir lise öğrenci projesinin yapay zeka asistanısın.

${PROJECT_CONTEXT}

CEVAP KURALLARIN:
1. Rolünden asla çıkma, her zaman bu projenin asistanı gibi davran.
2. Bir soru sorulduğunda doğrudan cevaba geç. Girişte "Proje belgesine göre" veya "Projede bu bilgi yok ama" gibi kalıpları ASLA kullanma. 
3. Bilgi proje belgesinde varsa o bilgiyi kullanarak direkt yanıtla. Proje belgesinde yoksa, kimya, çevre bilimi veya adsorpsiyon konularındaki genel bilginle sanki projenin bir parçasıymış gibi akıcı ve doğrudan yanıtla.
4. Her zaman Türkçe yanıt ver.
5. Cevaplarını her zaman maksimum 3-4 cümleyle sınırla, asla çok uzun paragraflar yazma.
6. Gerekmedikçe teknik jargon kullanma, kullanırsan açıkla.`;

  // Öneri isteği ise daha hafif bir sistem prompt kullan
  const activeSystemPrompt = isSuggestion ? SUGGESTION_SYSTEM_PROMPT : SYSTEM_PROMPT;

  const conversationMessages = [
    { role: 'system', content: activeSystemPrompt }
  ];

  // Öneri isteği değilse geçmiş konuşmaları ekle
  if (!isSuggestion && history && Array.isArray(history)) {
    history.forEach(msg => {
      conversationMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
  }

  conversationMessages.push({ role: 'user', content: message });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-32b',
        messages: conversationMessages,
        // Öneri isteği için daha az token yeterli
        max_tokens: isSuggestion ? 200 : 1024,
        temperature: isSuggestion ? 0.85 : 0.4,
        top_p: 0.8
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    // <think>...</think> bloklarını temizle
    let cleanReply = data.choices[0].message.content
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .trim();

    return res.status(200).json({ reply: cleanReply });

  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
}
