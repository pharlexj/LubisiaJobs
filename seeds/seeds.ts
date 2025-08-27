import { storage } from './../server/storage';

const jobGroups = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K',
  'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T'
];

const counties = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu',
  'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa',
  'Murang’a', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita Taveta', 'Tana River', 'Tharaka Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

const subCountyMap: Record<string, string[]> = {
  'Trans Nzoia': ['Kiminini', 'Saboti', 'Endebess', 'Cherangany', 'Kwanza'],
  'Bungoma': ['Kabuchai', 'Kimilili', 'Sirisia', 'Webuye East', 'Webuye West', 'Bumula', 'Kanduyi', 'Mt Elgon'],
  'Uasin Gishu': ['Soy', 'Turbo', 'Moiben', 'Kapseret', 'Kesses', 'Ainabkoi'],
  'Kakamega': ['Lurambi', 'Malava', 'Mumias East', 'Mumias West', 'Navakholo', 'Butere', 'Ikolomani', 'Shinyalu', 'Khwisero'],
  'West Pokot': ['Pokot South', 'Pokot North', 'Sigor', 'Kapenguria'],
  'Busia': ['Teso North', 'Teso South', 'Nambale', 'Matayos', 'Butula', 'Bunyala'],
  'Vihiga': ['Luanda', 'Emuhaya', 'Hamisi', 'Sabatia', 'Vihiga'],
  'Nandi': ['Nandi Hills', 'Chesumei', 'Emgwen', 'Mosop', 'Aldai', 'Tinderet'],
  'Nairobi': ['Westlands', 'Lang’ata', 'Embakasi', 'Starehe', 'Dagoretti', 'Kamukunji', 'Mathare', 'Kasarani', 'Makadara'],
  'Mombasa': ['Mvita', 'Changamwe', 'Jomvu', 'Kisauni', 'Nyali', 'Likoni'],
  'Kisumu': ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Nyando', 'Muhoroni', 'Seme'],
  'Nakuru': ['Nakuru Town East', 'Nakuru Town West', 'Naivasha', 'Gilgil', 'Molo', 'Kuresoi North', 'Kuresoi South', 'Subukia', 'Rongai'],
  'Machakos': ['Machakos Town', 'Mavoko', 'Masinga', 'Yatta', 'Kangundo', 'Kathiani', 'Matungulu'],
};
const wardMap: Record<string, string[]> = {
    //Trans Nzoia County
  'Cherangany': ['Makutano', 'Kaplamai', 'Sinyerere', 'Motosiet', 'Chepsiro/Kiptoror', 'Kapkures', 'Cherangany/Suwerwa'],
  'Saboti': ['Saboti', 'Tuwan', 'Matisi', 'Mbakalo', 'Kinyoro'],
  'Kiminini': ['Kiminini', 'Waitaluk', 'Sirende', 'Sikhendu', 'Nabiswa'],
  'Endebess': ['Endebess', 'Matumbei', 'Chepchoina'],
    'Kwanza': ['Kwanza', 'Kapomboi', 'Keiyo', 'Bidii'],
    // Bungoma County
  'Mt Elgon': [    'Cheptais', 'Chesikaki', 'Chepyuk', 'Kapkateny', 'Kaptama', 'Elgon'  ],
  'Sirisia': [    'Namwela', 'Malakisi/South Kulisiru', 'Lwandanyi'  ],
  'Kabuchai': [    'Kabuchai/Chwele', 'West Nalondo', 'Bwake/Luuya', 'Mukuyuni', 'South Bukusu' ],
  'Kanduyi': [    'Bukembe West', 'Bukembe East', 'Township', 'Khalaba', 'Musikoma', 'East Sang’alo',  'Tuuti/Marakaru', 'West Sang’alo'
  ],
  'Bumula': ['Bumula', 'Khasoko', 'Kabula', 'Kimaeti', 'South Bukusu', 'Siboti'  ],
  'Webuye East': ['Mihuu', 'Ndivisi', 'Maraka' ],
  'Webuye West': [    'Sitikho', 'Matulo', 'Bokoli'  ],
  'Kimilili': [    'Kibingei', 'Kimilili', 'Maeni', 'Kamukuywa'  ],
  'Tongaren': [    'Mbakalo', 'Naitiri/Kabuyefwe', 'Milima', 'Ndalu/Tabani', 'Tongaren', 'Soysambu/Mitua'
    ],
  //Kakamega County
  'Lugari': ['Mautuma', 'Lugari', 'Lumakanda', 'Chekalini', 'Chevaywa', 'Lawandeti'],
  'Likuyani': ['Likuyani', 'Sango', 'Kongoni', 'Nzoia', 'Sinoko'],
  'Malava': ['West Kabras', 'Chemuche', 'East Kabras', 'Butali/Chegulo', 'Manda-Shivanga', 'Shirugu-Mugai', 'South Kabras'],
  'Lurambi': ['Butsotso East', 'Butsotso South', 'Butsotso Central', 'Sheywe', 'Mahiakalo', 'Shirere'],
  'Mumias East': ['Lusheya/Lubinu', 'Malaha/Isongo', 'Makunga/East Wanga'],
  'Navakholo': ['Ingotse-Mathia', 'Shinoyi-Shikomari', 'Esumeyia', 'Bunyala West', 'Bunyala East', 'Bunyala Central'],
  'Mumias West': ['Mumias Central', 'Mumias North', 'Etenje', 'Musanda'],
  'Matungu': ['Koyonzo', 'Kholera', 'Khalaba', 'Mayoni', 'Namamali'],
  'Butere': ['Marama West', 'Marama Central', 'Marenyo-Shianda', 'Marama North', 'Marama South'],
  'Khwisero': ['Kisa North', 'Kisa East', 'Kisa West', 'Kisa Central'],
  'Ikolomani': ['Idakho South', 'Idakho North', 'Idakho East', 'Idakho Central'],
    'Shinyalu': ['Isukha North', 'Isukha Central', 'Isukha South', 'Isukha East', 'Isukha West', 'Murhanda'],
  //Uasin Gishu County
    'Soy': ['Kuinet/Kapsuswa', 'Segero/Barsombe', 'Kipsomba', 'Moi’s Bridge', 'Kapkures'],
  'Turbo': ['Huruma', 'Kamagut', 'Kapsaos', 'Kiplombe', 'Ngenyilel', 'Tapsagoi'],
  'Moiben': ['Karuna/Meibeki', 'Kimumu', 'Moiben', 'Sergoit', 'Tembelio'],
  'Kesses': ['Cheptiret/Kipchamo', 'Racecourse', 'Tarakwa', 'Tulwet/Chuiyat'],
  'Kapseret': ['Kipkenyo', 'Langas', 'Ngeria', 'Simat/Kapseret', 'Megun'],
    'Ainabkoi': ['Ainabkoi/Olare', 'Kaptagat', 'Kapsoya'],
     // Nairobi County
  'Westlands': ['Kitisuru', 'Parklands', 'Karura', 'Mountain View', 'Kangemi'],
  'Kibra': ['Makina', 'Woodley', 'Sarang’ombe', 'Lindi', 'Laini Saba'],
  'Roysambu': ['Githurai', 'Kahawa West', 'Zimmerman', 'Roysambu', 'Kahawa'],
  'Dagoretti South': ['Mutu-ini', 'Ngando', 'Uthiru', 'Waithaka', 'Riruta'],
  'Dagoretti North': ['Kawangware', 'Kilimani', 'Gatina', 'Kileleshwa', 'Kabiro'],
  'Langata': ['Karen', 'Nairobi West', 'South C', 'Nyayo Highrise'],
  'Kasarani': ['Clay City', 'Ruai', 'Mwiki', 'Njiru', 'Kamulu'],
  'Ruaraka': ['Baba Dogo', 'Lucky Summer', 'Mathare North', 'Utalii', 'Korogocho'],
  'Mathare': ['Huruma', 'Mabatini', 'Kiamaiko', 'Ngei', 'Mlango Kubwa'],
  'Starehe': ['Nairobi Central', 'Ngara', 'Pangani', 'Ziwani', 'Landimawe', 'Nairobi South'],
  'Makadara': ['Maringo', 'Hamza', 'Viwandani', 'Harambee', 'Makongeni'],
  'Kamukunji': ['Pumwani', 'Eastleigh North', 'Eastleigh South', 'Airbase', 'California'],
  'Embakasi Central': ['Kayole North', 'Kayole South', 'Komarocks', 'Chokaa', 'Matopeni'],
  'Embakasi East': ['Upper Savanna', 'Lower Savanna', 'Embakasi', 'Utawala', 'Mihang’o'],
  'Embakasi West': ['Umoja 1', 'Umoja 2', 'Mowlem', 'Kariobangi South'],
  'Embakasi North': ['Kariobangi North', 'Dandora I', 'Dandora II', 'Dandora III', 'Dandora IV'],
  'Embakasi South': ['Kwa Reuben', 'Imara Daima', 'Kwa Njenga', 'Pipeline', 'Kware'],

  // Busia County
  'Teso North': ['Malaba Central', 'Malaba North', 'Ang’urai South', 'Malaba South', 'Ang’urai North', 'Ang’urai East'],
  'Teso South': ['Ang’orom', 'Chakol South', 'Amukura Central', 'Chakol North', 'Amukura East', 'Amukura West'],
  'Nambale': ['Nambale Township', 'Bukhayo North/Waltsi', 'Bukhayo East', 'Bukhayo Central'],
  'Matayos': ['Bukhayo West', 'Mayenje', 'Matayos South', 'Busibwabo', 'Burumba'],
  'Butula': ['Marachi West', 'Kingandole', 'Marachi Central', 'Marachi East', 'Marachi North', 'Elugulu'],
  'Funyula': ['Namboboto/Nambuku', 'Nangina', 'Bwiri', 'Ageng’a Nanguba'],
  'Budalang’i': ['Bunyala Central', 'Bunyala North', 'Bunyala West', 'Bunyala South'],

  // Mombasa County
  'Changamwe': ['Port Reitz', 'Kipevu', 'Airport', 'Miritini', 'Chaani'],
  'Jomvu': ['Jomvu Kuu', 'Magongo', 'Mikindani'],
  'Kisauni': ['Mjambere', 'Junda', 'Bamburi', 'Mwakirunge', 'Mtopanga', 'Magogoni', 'Shanzu'],
  'Nyali': ['Frere Town', 'Ziwa la Ng’ombe', 'Mkomani', 'Kongowea', 'Kadzandani'],
  'Likoni': ['Mtongwe', 'Shika Adabu', 'Bofu', 'Likoni', 'Timbwani'],
  'Mvita': ['Mji Wa Kale/Makadara', 'Tudor', 'Tononoka', 'Shimanzi/Ganjoni', 'Majengo'],  
  // 🌄 West Pokot County
  'Kapenguria': ['Riwo', 'Kapenguria', 'Mnagei', 'Siyoi', 'Endugh', 'Sook'],
  'Sigor': ['Sekerr', 'Masool', 'Lomut', 'Weiwei'],
  'Kacheliba': ['Suam', 'Kodich', 'Kasei', 'Kapchok', 'Kiwawa', 'Alale'],
  'Pokot South': ['Chepareria', 'Batei', 'Lelan', 'Tapach'],

  // 🌿 Vihiga County
  'Vihiga': ['Lugaga-Wamuluma', 'South Maragoli', 'Central Maragoli', 'Mungoma'],
  'Sabatia': ['Lyaduywa/Izava', 'West Sabatia', 'Chavakali', 'North Maragoli', 'Wodanga', 'Busali'],
  'Hamisi': ['Shiru', 'Gisambai', 'Shamakhokho', 'Banja', 'Muhudu', 'Tambaa', 'Jepkoyai'],
  'Luanda': ['Luanda Township', 'Wemilabi', 'Mwibona', 'Luanda South', 'Emabungo'],
  'Emuhaya': ['North East Bunyore', 'Central Bunyore', 'West Bunyore'],

  // 🏞️ Nandi County
  'Mosop': ['Chepterwai', 'Kipkaren', 'Kurgung/Surungai', 'Kabiyet', 'Ndalat', 'Kabisaga', 'Sangalo/Kebulonik'],
  'Aldai': ['Kabwareng', 'Terik', 'Kemeloi-Maraba', 'Kobujoi', 'Kaptumo-Kaboi', 'Koyo-Ndurio'],
  'Chesumei': ['Chemundu/Kapng’etuny', 'Kosirai', 'Lelmokwo/Ngechek', 'Kaptel/Kamoiywo', 'Kiptuya'],
  'Emgwen': ['Chepkumia', 'Kapkangani', 'Kapsabet', 'Kilibwoni'],
  'Nandi Hills': ['Nandi Hills', 'Chepkunyuk', 'Ol’lessos', 'Kapchorua'],
  'Tinderet': ['Songhor/Soba', 'Tinderet', 'Chemelil/Chemase', 'Kapsimotwo'],

  // 🌋 Nakuru County
  'Molo': ['Mariashoni', 'Elburgon', 'Turi', 'Molo'],
  'Njoro': ['Mau Narok', 'Mauche', 'Kihingo', 'Nessuit', 'Lare', 'Njoro'],
  'Naivasha': ['Biashara', 'Hell’s Gate', 'Lake View', 'Maiella', 'Mai Mahiu', 'Olkaria', 'Naivasha East', 'Viwandani'],
  'Nakuru Town West': ['Barut', 'London', 'Kaptembwo', 'Kapkures', 'Rhoda', 'Shabaab'],
  'Gilgil': ['Gilgil', 'Elementaita', 'Mbaruk/Eburu', 'Malewa West', 'Murindati'],
  'Kuresoi South': ['Amalo', 'Keringet', 'Kiptagich', 'Tinet'],
  'Kuresoi North': ['Kiptororo', 'Nyota', 'Sirikwa', 'Kamara'],
  'Subukia': ['Subukia', 'Waseges', 'Kabazi'],
  'Rongai': ['Menengai West', 'Visoi', 'Mosop', 'Solai'],
  'Bahati': ['Dundori', 'Kabatini', 'Kiamaina', 'Lanet/Umoja', 'Bahati'],
  'Nakuru Town East': ['Biashara', 'Kivumbini', 'Flamingo', 'Menengai', 'Nakuru East'],

  // 🏙️ Machakos County
  'Masinga': ['Kivaa', 'Masinga Central', 'Ekalakala', 'Muthesya', 'Ndithini'],
  'Yatta': ['Ndalani', 'Matuu', 'Kithimani', 'Ikomba', 'Katangi'],
  'Kangundo': ['Kangundo North', 'Kangundo Central', 'Kangundo East', 'Kangundo West'],
  'Matungulu': ['Tala', 'Matungulu North', 'Matungulu East', 'Matungulu West', 'Kyeleni'],
  'Kathiani': ['Mitaboni', 'Kathiani Central', 'Upper Kaewa/Iveti', 'Lower Kaewa/Kaani'],
  'Mavoko': ['Mlolongo', 'Syokimau/Mulolongo', 'Kinanie', 'Athi River'],
  'Machakos Town': ['Kalama', 'Mua', 'Mutituni', 'Machakos Central', 'Mumbuni North', 'Muvuti/Kiima-Kimwe', 'Kola'],
  'Mwala': ['Mwala', 'Muthetheni', 'Wamunyu', 'Kibauni', 'Makutano/Mwala']
};

async function seedJobGroups() {
  for (const name of jobGroups) {
    await storage.seedJobGroup({ name });
  }
  console.log('✅ Job Groups seeded');
}

async function seedCounties() {
  for (const name of counties) {
    await storage.seedCounties({ name });
  }
  console.log('✅ Counties seeded');
}

async function seedSubCounties() {
  for (const [countyName, subNames] of Object.entries(subCountyMap)) {
    const county = await storage.getCountyByCountyName(countyName);
    if (!county) {
      console.warn(`⚠️ County not found: ${countyName}`);
      continue;
    }

    for (const name of subNames) {
      await storage.seedSubCounties({
        name,
        countyId: county.id,
        createdAt: new Date(),
      });
    }
  }

  console.log('✅ Sub-counties seeded');
}
async function seedWards() {
  for (const [constituencyName, wardNames] of Object.entries(wardMap)) {
    const constituency = await storage.getConstituencyByName(constituencyName);
    if (!constituency) {
      console.warn(`⚠️ Constituency not found: ${constituencyName}`);
      continue;
    }

    for (const name of wardNames) {
      await storage.seedWard({
        name,
        constituencyId: constituency.id,
        createdAt: new Date(),
      });
    }
  }

  console.log('✅ Wards seeded successfully');
}
// Run all seeds
async function runAllSeeds() {
  await storage.truncateAll();
  await seedJobGroups();
  await seedCounties();
  await seedSubCounties();
  await seedWards();

  console.log('🌱 All seed operations completed');
}

runAllSeeds().catch(console.error);
 