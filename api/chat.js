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

  const { message, history } = req.body;

  // ==========================================================
  // AKILLI ÖNERİ KONTROLÜ VE 200 SORULUK SIFIR TOKEN HAVUZU
  // ==========================================================
  // Frontend kodunun istek tarzına göre; mesaj boşsa, "öneri", "suggestion" veya "soru" içeriyorsa 
  // Groq'a hiç gitmeden doğrudan lokal havuzdan 3 rastgele soru döner.
  const isSuggestionRequest = !message || 
                              message.trim() === "" || 
                              message.toLowerCase().includes("öneri") || 
                              message.toLowerCase().includes("soru") || 
                              message.toLowerCase().includes("suggestion");

  if (isSuggestionRequest) {
    const misirKocaniSoruHavuzu = [
      // Genel Proje ve Problem Soruları
      "Mısır koçanı projenizin temel amacı nedir?",
      "Bu projeyi seçmenizdeki en büyük etken neydi?",
      "Projenizin soru cümlesi tam olarak nedir?",
      "Çevresel sorunlara ekonomik bir çözüm bulabildiniz mi?",
      "Projeniz ne kadar sürede tamamlandı?",
      "TÜBİTAK 4006 için bu konunun seçilme nedeni nedir?",
      "Projeniz çevreye nasıl bir katkı sağlıyor?",
      "Bu proje evsel atık yönetimini nasıl etkiler?",
      "Mısır koçanı projesi ticari bir ürüne dönüştürülebilir mi?",
      "Projenizi yaparken en çok hangi aşamada zorlandınız?",
      "Gelecekte bu projeyi daha da geliştirmek isteseniz ne yapardınız?",
      "Bu projeyi yaparken aldığınız en şaşırtıcı sonuç neydi?",
      "Projenizin topluma faydaları nelerdir?",
      "Proje ekibiniz kaç kişiden oluşuyor ve görev dağılımı nasıl?",
      "Danışman öğretmenlerinizin projeye katkısı ne oldu?",
      "Mısır koçanı projesinin bütçesi ne kadardı?",
      "Bu arıtma yöntemi sürdürülebilir kalkınma hedeflerine uyuyor mu?",
      "Projenizin hedef kitlesi kimlerdir?",
      "Yerel yönetimler bu projeden nasıl faydalanabilir?",
      "Bu projeyi okul laboratuvarı dışında deneme şansınız oldu mu?",
      
      // Kimya ve Adsorpsiyon Teorisi Soruları
      "Adsorpsiyon nedir, kısaca açıklayabilir misiniz?",
      "Absorpsiyon ile adsorpsiyon arasındaki fark nedir?",
      "Mısır koçanı nasıl bir adsorban (tutucu) özelliği gösterir?",
      "Mısır koçanının yüksek selülozik yapısı ne işe yarar?",
      "Selüloz molekülleri ağır metalleri nasıl bağlar?",
      "Mısır koçanının gözenekli yapısı adsorpsiyonu nasıl etkiler?",
      "Biyoadsorpsiyon ne demektir?",
      "Kimyasal çöktürme yöntemi neden deşarj standartlarını sağlamıyor?",
      "Konvansiyonel arıtma yöntemleri nelerdir?",
      "Ekstraksiyon yöntemi ağır metal arıtımında nasıl kullanılır?",
      "İyon değiştirme yöntemiyle krom arıtımı nasıl yapılır?",
      "Birlikte çöktürme yöntemi bu projeye alternatif olabilir mi?",
      "Adsorpsiyon kapasitesi neye göre değişir?",
      "Sıcaklık değişimi mısır koçanının tutma verimini etkiler mi?",
      "pH değerinin adsorpsiyon sürecindeki önemi nedir?",
      "Çözeltinin asidik olması krom arıtımını zorlaştırır mı?",
      "Bazik ortamlarda mısır koçanı nasıl reaksiyon gösterir?",
      "Aktif karbon ile mısır koçanı arasındaki yapısal farklar nelerdir?",
      "Biyokömür (biochar) nedir ve mısır koçanından elde edilebilir mi?",
      "Mısır koçanı yüzeyindeki fonksiyonel gruplar nelerdir?",
      
      // Ağır Metaller ve Krom (VI) Soruları
      "Krom (VI) (Cr6+) nedir ve neden tehlikelidir?",
      "Krom kirliliği en çok hangi sanayi kollarından suya karışır?",
      "Krom (III) ile Krom (VI) arasındaki farklar nelerdir?",
      "Krom (VI) iyonları insan sağlığına ne gibi zararlar verir?",
      "Ağır metal kirliliği ekosistemi nasıl tehdit eder?",
      "Krom (VI) kanserojen bir madde midir?",
      "İçme suyunda bulunabilecek maksimum krom miktarı ne kadardır?",
      "Doğaya salınan ağır metaller besin zincirine nasıl katılır?",
      "Krom kirliliği bitki gelişimini nasıl etkiler?",
      "Atık sulardaki iz metaller ne anlama gelir?",
      "Potasyum dikromat (K2Cr2O7) kimyasalının özellikleri nelerdir?",
      "Deneyde neden özellikle potasyum dikromat seçildi?",
      "Krom iyonları su molekülleriyle nasıl bir bağ kurar?",
      "Krom arıtıldıktan sonra mısır koçanından geri kazanılabilir mi?",
      "Kromun sudan tamamen temizlenmesi mümkün müdür?",
      "Endüstriyel atık sularda en sık rastlanan diğer ağır metaller nelerdir?",
      "Krom (VI)'nın çevre standartlarındaki yasal deşarj limiti nedir?",
      "Krom kirliliği yer altı sularına nasıl sızar?",
      "Kromun sudaki varlığı balık ölümlerine yol açar mı?",
      "Tekstil fabrikalarının atık sularında krom bulunur mu?",
      
      // Deney Metodolojisi ve Aşamaları Soruları
      "Batch (kesikli) yöntem nedir ve deneyde nasıl uygulandı?",
      "Deneyde mısır koçanı neden havanda dövülerek toz haline getirildi?",
      "Küçük tanecik boyutu temas yüzeyini nasıl artırır?",
      "Yüzey alanının artması adsorpsiyon hızını nasıl etkiler?",
      "Deneyde neden 0,025 M konsantrasyon tercih edildi?",
      "0,025 M Potasyum dikromat çözeltisi nasıl hazırlandı?",
      "Neden tam olarak 0,5 gram mısır koçanı tartıldı?",
      "50 mL çözelti hacmi bu deney için neden idealdir?",
      "Karışım neden oda koşullarında bekletildi?",
      "8 saatlik bekleme süresi adsorpsiyon için yeterli miydi?",
      "24 saat bekletildiğinde arıtım verimi ne kadar arttı?",
      "Mavi bant süzgeç kağıdı nedir ve neden kullanıldı?",
      "Siyah bant veya beyaz bant süzgeç kağıdı kullanılsa ne değişirdi?",
      "Mavi bant süzgeç kağıdının gözenek büyüklüğü ne kadardır?",
      "Süzme işlemi (filtrasyon) ne kadar sürdü?",
      "Deney sırasında sıcaklık kontrolü yapıldı mı?",
      "Mısır koçanı toz haline getirilmeden önce kurutuldu mu?",
      "Deneyi kaç kez tekrarlayarak doğruluğunu kontrol ettiniz?",
      "Deneyde kullanılan havandaki öğütme kalitesi standart mıydı?",
      "Karışımı bekletirken sürekli çalkalamak verimi artırır mıydı?",
      
      // Bulgular ve Sonuç Soruları
      "Deney sonrasındaki renk değişimi tam olarak nasıldı?",
      "Çözeltinin koyu turuncudan açık sarıya dönmesi bize neyi kanıtlar?",
      "Sadece gözleme dayalı sonuç çıkarmak bilimsel olarak yeterli midir?",
      "Mısır koçanının kromun belirli bir miktarını tuttuğunu nasıl anladınız?",
      "Renk değişimi dışında bir ölçüm yöntemi kullandınız mı?",
      "Üzüm çöpü aktif karbonu ile mısır koçanı verimi nasıl kıyaslandı?",
      "Deney sonuçlarına göre mısır koçanı iyi bir adsorban mıdır?",
      "Arıtılmış çözeltinin içinde hiç mısır koçanı partikülü kaldı mı?",
      "Deneyde başarısız olan veya beklenmeyen bir aşama oldu mu?",
      "Mısır koçanı atık havuzlarının neresine yerleştirilmelidir?",
      "Havuz diplerine yerleştirilen mısır koçanları ne kadar süre aktif kalabilir?",
      "Mısır koçanı organik kirlilikleri de giderebilir mi?",
      "Projenizin sonuç kısmındaki 'aletsel denemeler' ifadesi ne anlama geliyor?",
      "Aletsel analizler yapılsa hangi cihazlar kullanılırdı (Örn: AAS, ICP-OES)?",
      "Renk değişimi spektrofotometre ile ölçülebilir miydi?",
      "Deney sonucunda elde edilen veriler literatürle uyuşuyor mu?",
      "Mısır koçanının bölgede bol bulunması ekonomik açıdan ne sağlar?",
      "Hayvan yemi olarak kullanılan mısır koçanının bu alana yönlendirilmesi mantıklı mı?",
      "Mısır koçanı yakılmak yerine bu şekilde değerlendirilirse karbon salınımı azalır mı?",
      "Bu yöntem ne kadar ucuz, bir maliyet analizi yaptınız mı?",
      
      // Gelecek ve Geliştirme Soruları
      "Bu proje gerçek bir arıtma tesisine nasıl entegre edilebilir?",
      "Mısır koçanı filtreleri fabrikaların bacalarında veya borularında kullanılabilir mi?",
      "Mısır koçanı kimyasal olarak modifiye edilirse (Örn: asit aktivasyonu) verim artar mı?",
      "Farklı tarımsal atıklar (Örn: ceviz kabuğu, pirinç kabuğu) bu deneyde denenebilir mi?",
      "Mısır koçanı filtrelerinin temizlenmesi ve yeniden kullanılması mümkün mu?",
      "Bu yöntemle arıtılan su sulama suyu olarak kullanılabilir mi?",
      "Ağır metal tutmuş mısır koçanları deney sonrasında nasıl imha edilmelidir?",
      "Krom yüklü mısır koçanlarının doğaya atılması yeni bir kirlilik yaratır mı?",
      "Büyük ölçekli endüstriyel havuzlarda tıkanma problemi yaşanır mı?",
      "Bu projeyi bir TÜBİTAK yarışmasına taşımayı düşünüyor musunuz?",
      "Tarımsal atıkların geri dönüşümü neden önemlidir?",
      "Mısır koçanı yerine mısır püskülü kullanılsa sonuç ne olurdu?",
      "Arıtma süresini 8 saatten daha aşağıya indirmenin bir yolu var mı?",
      "Deneydeki adsorpsiyon hız sabitini hesaplamayı denediniz mu?",
      "Projeniz sıfır atık politikasına nasıl destek veriyor?",
      "Projenizi sanayideki bir arıtma uzmanına gösterdiniz mi, yorumu ne oldu?",
      "Bu yöntem evlerdeki musluk filtrelerinde kullanılabilir mi?",
      "Krom dışındaki kurşun veya cıva gibi ağır metallerde de işe yarar mı?",
      "Mısır koçanı biyobozunur bir malzeme olduğu için suda çürür mü?",
      "Suda çürüme yaparsa KOİ (Kimyasal Oksijen İhtiyacı) değerini artırır mı?",
      
      // Derin Kimya ve Literatür Soruları
      "Kaynakça listesindeki çalışmalar projenize nasıl yön verdi?",
      "Petrol içeren atık suların arıtımı ile krom arıtımı arasındaki benzerlik nedir?",
      "Aktif karbon üretimi neden pahalı bir yöntemdir?",
      "Mısır koçanı aktif karbon haline getirilmeden doğrudan kullanılabilir mi?",
      "Literatürdeki yüksek lisans tezleri projenizin hangi kısmını doğruluyor?",
      "Adsorpsiyon izotermleri (Langmuir, Freundlich) hakkında bilginiz var mı?",
      "Deneyiniz hangi adsorpsiyon izotermine daha uygun görünüyor?",
      "Mısır koçanının spesifik yüzey alanı (BET) yaklaşık ne kadardır?",
      "Potasyum dikromatın sudaki çözünürlük limitleri nelerdir?",
      "Krom (VI)'nın indirgenerek Krom (III)'e dönüştürülmesi bir arıtma mıdır?",
      "Mısır koçanı kromu doğrudan indirgiyor mu yoksa sadece yüzeyde mi tutuyor?",
      "Biyokütle kaynaklı adsorbanların avantajları ve dezavantajları nelerdir?",
      "Endüstride adsorpsiyon kolonları nasıl çalışır?",
      "Kesikli (Batch) sistem yerine sürekli akışlı (Continuous) sistem kullanılabilir miydi?",
      "Mısır koçanının nem oranı adsorpsiyonu nasıl etkiler?",
      "Laboratuvarda çalışırken hangi güvenlik önlemlerini aldınız?",
      "Potasyum dikromat ile çalışırken maske ve eldiven kullanımı neden zorunludur?",
      "Mavi bant süzgeç kağıdının kül bırakmama özelliği var mıdır?",
      "Deneyde saf su mu yoksa musluk suyu mu kullandınız?",
      "Musluk suyu kullanılsaydı içindeki diğer iyonlar krom arıtımını nasıl etkilerdi?",
      
      // Proje Detayları ve Uygulama Soruları
      "Rabia, Derin, Mert Ali ve Emirhan'ın projedeki tam rolleri neydi?",
      "Levent ve Hamit öğretmenleriniz size en çok hangi konuda rehberlik etti?",
      "Projenizin web sitesini hazırlamak fikri nereden çıktı?",
      "Web sitesindeki AI asistanı jüriye sunum yaparken nasıl bir kolaylık sağlayacak?",
      "Mısır koçanlarını nereden temin ettiniz?",
      "Koçanları öğütürken kullandığınız havandaki tanecik boyutunu nasıl standartlaştırdınız?",
      "Deney kapları olarak ne kullandınız (beher, erlenmeyer vb.)?",
      "Oda koşulları dediniz, laboratuvar sıcaklığı ortalama kaç dereceydi?",
      "8 saatlik bekleme süresinde karışımı hiç karıştırdınız mı?",
      "Renk değişimi fotoğraf veya videolarla kayıt altına alındınız mı?",
      "Sitenizdeki renk paleti projenin renk değişimiyle mi ilgili?",
      "Projenizin en yenilikçi yönü sizce nedir?",
      "Bu proje çevre mühendisliği öğrencilerine nasıl bir örnek oluşturur?",
      "Arıtılan suyun berraklığı nasıldı, bulanıklık kaldı mı?",
      "Mısır koçanı tozunun rengi çözeltiye geçti mi?",
      "Deney bittiğinde filtre kağıdının üstünde kalan mısır koçanının rengi değişmiş miydi?",
      "Mısır koçanı lifleri süzgeç kağıdından aşağıya sızdı mı?",
      "Bu arıtma yönteminin işletme maliyeti sıfıra yakın diyebilir miyiz?",
      "Fabrikalar neden pahalı yöntemler yerine bu mısır koçanı yöntemini seçmeli?",
      "Projenizin afişini ve posterini hazırlarken nelere dikkat ettiniz?",
      
      // İleri Düzey Çevre ve Teknoloji Soruları
      "Tarımsal atıkların çevre kirliliğini önlemede kullanımı dünyada ne kadar yaygın?",
      "Mısır koçanının kimyasal bileşiminde selüloz dışında ne var (lignin, hemiselüloz)?",
      "Lignin maddesi de ağır metal tutumunda rol oynar mı?",
      "Arıtma havuzlarının dibine yerleştirilen mısır koçanları su akıntısıyla taşınır mı?",
      "Koçanları sabitlemek için nasıl bir mekanizma önerirsiniz?",
      "Bu proje bir TÜBİTAK 4004 veya 4005 projesine dönüştürülebilir mi?",
      "Ağır metal kirliliği göstergesi olarak biyoindikatör bitkiler kullanılabilir mi?",
      "Krom arıtımında mısır koçanının maksimum yükleme kapasitesi nasıl ölçülür?",
      "Çözeltide birden fazla ağır metal (Kurşun + Krom) olsaydı yarışmalı adsorpsiyon nasıl gerçekleşirdi?",
      "Mısır koçanı hangi metali daha önce tutardı?",
      "Deneyiniz yeşil kimya ilkelerine ne kadar uyuyor?",
      "Projenizin sürdürülebilir çevre politikalarına etkisi nedir?",
      "Mısır koçanı tozunun yoğunluğu sudan hafif olduğu için yüzme problemi yaşandı mı?",
      "Yüzen koçan tozlarını dibe çöktürmek için ne yaptınız?",
      "Deney süresini 24 saatin üzerine çıkarsaydınız adsorpsiyon doyuma ulaşır mıydı?",
      "Doyum noktası ne demektir?",
      "Mısır koçanının kimyasal aktivasyonu için hangi asitler tercih edilebilir?",
      "Gözenek hacmini artırmak için ısıl işlem uygulanabilir mi?",
      "TÜBİTAK 4006 sergisine gelecek olan ziyaretçilere bu deneyi canlı gösterecek misiniz?",
      "Sergide renk değişimini göstermek için hazır numuneleriniz olacak mı?",
      
      // Genel Değerlendirme ve Kapanış Soruları
      "Bu projeden elde ettiğiniz en önemli tecrübe ne oldu?",
      "Bilimsel bir araştırma projesi hazırlamak size ne kazandırdı?",
      "Gelecekte kimya veya çevre mühendisliği okumayı düşünüyor musunuz?",
      "Mısır koçanının bu gücü olmasaydı alternatif olarak hangi atığı denerdiniz?",
      "Projenizin bilim dünyasına küçük de olsa katkısı sizce nedir?",
      "Arıtılmış sudaki krom konsantrasyonunu kesin ölçmek için bütçeniz olsaydı ne yapardınız?",
      "Bu projeyle ilgili patent almayı düşündünüz mü?",
      "Mısır koçanı filtre sisteminin prototipini yapmayı planlıyor musunuz?",
      "Projenizin başarıya ulaştığını gönül rahatlığıyla söyleyebilir misiniz?",
      "Bana mısır koçanı projenizi tek bir cümleyle özetler misiniz?"
    ];

    const kopyaHavuz = [...misirKocaniSoruHavuzu];
    const secilenSorular = [];
    for (let i = 0; i < 3; i++) {
      if (kopyaHavuz.length === 0) break;
      const rastgeleIndeks = Math.floor(Math.random() * kopyaHavuz.length);
      secilenSorular.push(kopyaHavuz.splice(rastgeleIndeks, 1)[0]);
    }

    return res.status(200).json({ reply: secilenSorular.join('\n') });
  }

  // ==========================================================
  // NORMAL MESAJLAR İÇİN ESKİ DÜZENDE DEVAM EDEN KOD (QWEN)
  // ==========================================================
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

  const SYSTEM_PROMPT = `Sen TÜBİTAK 4006 kapsamında yapılmış bir lise öğrenci projesinin yapay zeka asistanısın.

${PROJECT_CONTEXT}

CEVAP KURALLARIN:
1. Rolünden asla çıkma, her zaman bu projenin asistanı gibi davran.
2. Bir soru sorulduğunda doğrudan cevaba geç. Girişte "Proje belgesine göre" veya "Projede bu bilgi yok ama" gibi kalıpları ASLA kullanma. 
3. Bilgi proje belgesinde varsa o bilgiyi kullanarak direkt yanıt ver. Proje belgesinde yoksa, kimya, çevre bilimi veya adsorpsiyon konularındaki genel bilginle sanki projenin bir parçasıymış gibi akıcı ve doğrudan yanıtla.
4. Her zaman Türkçe yanıt ver.
5. Cevaplarını her zaman maksimum 3-4 cümleyle sınırla, asla çok uzun paragraflar yazma.
6. Gerekmedikçe teknik jargon kullanma, kullanırsan açıkla.`;

  const conversationMessages = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  if (history && Array.isArray(history)) {
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
        max_tokens: 1024,
        temperature: 0.4,
        top_p: 0.8
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    let cleanReply = data.choices[0].message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    return res.status(200).json({ reply: cleanReply });

  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
}
