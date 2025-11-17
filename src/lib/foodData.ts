import { Alimento } from '@/types/nutrition';

// Base de datos completa de alimentos (320 items) - Migrados desde HTML original
export const seedAlimentos: Alimento[] = [
  // Panes y cereales
  {name:'Pan blanco',gi:75,carbs:49,kcal:265},{name:'Pan integral',gi:65,carbs:41,kcal:247},{name:'Pan centeno',gi:50,carbs:41,kcal:259},
  {name:'Tostada',gi:70,carbs:50,kcal:480},{name:'Bagel',gi:72,carbs:56,kcal:300},{name:'Pan pita',gi:57,carbs:56,kcal:275},
  
  // Arroces y pasta
  {name:'Arroz blanco cocido',gi:73,carbs:28,kcal:130},{name:'Arroz integral cocido',gi:50,carbs:23,kcal:111},{name:'Arroz basmati',gi:58,carbs:25,kcal:120},
  {name:'Pasta cocida',gi:51,carbs:25,kcal:131},{name:'Pasta integral',gi:42,carbs:25,kcal:124},{name:'Quinoa cocida',gi:53,carbs:21,kcal:120},
  {name:'Cuscus',gi:65,carbs:23,kcal:112},{name:'Masa pizza',gi:80,carbs:26,kcal:266},{name:'Pizza',gi:80,carbs:26,kcal:266},
  
  // Patatas
  {name:'Patata cocida',gi:78,carbs:17,kcal:87},{name:'Patata asada',gi:85,carbs:20,kcal:95},{name:'Pure patatas',gi:87,carbs:12,kcal:88},
  {name:'Patatas fritas',gi:75,carbs:49,kcal:536},{name:'Patatas chips',gi:75,carbs:49,kcal:536},{name:'Tortilla de patatas',gi:60,carbs:12,kcal:150},
  
  // Galletas y cereales
  {name:'Galletas',gi:75,carbs:65,kcal:450},{name:'Muesli',gi:50,carbs:64,kcal:450},{name:'Avena copos',gi:55,carbs:66,kcal:389},
  {name:'Avena instantanea',gi:79,carbs:66,kcal:380},{name:'Harina trigo',gi:85,carbs:76,kcal:364},{name:'Harina maiz',gi:70,carbs:72,kcal:360},
  {name:'Cereales azucarados',gi:81,carbs:84,kcal:357},{name:'Cornflakes',gi:81,carbs:84,kcal:357},
  
  // Dulces y azúcares
  {name:'Miel',gi:58,carbs:82,kcal:304},{name:'Azucar blanca',gi:65,carbs:100,kcal:387},{name:'Jarabe arce',gi:54,carbs:67,kcal:260},
  {name:'Sirope agave',gi:20,carbs:76,kcal:310},{name:'Sirope maiz',gi:100,carbs:76,kcal:310},{name:'Chocolate negro',gi:23,carbs:46,kcal:598},
  {name:'Chocolate con leche',gi:45,carbs:52,kcal:535},{name:'Helado',gi:61,carbs:23,kcal:207},{name:'Brownie',gi:65,carbs:50,kcal:450},
  {name:'Tarta queso',gi:60,carbs:20,kcal:321},{name:'Magdalena',gi:70,carbs:55,kcal:450},{name:'Croissant',gi:67,carbs:45,kcal:406},
  {name:'Donut',gi:76,carbs:50,kcal:452},{name:'Arroz con leche',gi:70,carbs:20,kcal:150},{name:'Crepe',gi:60,carbs:30,kcal:220},
  {name:'Gofre',gi:67,carbs:50,kcal:291},
  
  // Legumbres
  {name:'Lentejas cocidas',gi:32,carbs:20,kcal:116},{name:'Garbanzos cocidos',gi:28,carbs:27,kcal:164},{name:'Frijoles negros',gi:30,carbs:23,kcal:132},
  {name:'Alubias blancas',gi:31,carbs:24,kcal:140},{name:'Edamame',gi:18,carbs:8.9,kcal:121},{name:'Tofu',gi:15,carbs:1.9,kcal:76},
  {name:'Tempeh',gi:15,carbs:9.4,kcal:193},{name:'Hummus',gi:6,carbs:14.3,kcal:166},{name:'Falafel',gi:43,carbs:30,kcal:333},
  
  // Carnes y pescados
  {name:'Pollo pechuga',gi:0,carbs:0,kcal:165},{name:'Ternera',gi:0,carbs:0,kcal:250},{name:'Cerdo',gi:0,carbs:0,kcal:290},
  {name:'Cordero',gi:0,carbs:0,kcal:294},{name:'Salmón',gi:0,carbs:0,kcal:208},{name:'Atún',gi:0,carbs:0,kcal:132},
  
  // Lácteos y huevos
  {name:'Huevos',gi:0,carbs:1.1,kcal:155},{name:'Queso fresco',gi:0,carbs:1.3,kcal:98},{name:'Queso curado',gi:0,carbs:1.3,kcal:402},
  {name:'Yogur natural',gi:36,carbs:4.7,kcal:61},{name:'Yogur griego',gi:35,carbs:3.6,kcal:120},{name:'Leche entera',gi:41,carbs:5,kcal:61,density:1.03},
  {name:'Leche desnatada',gi:32,carbs:5,kcal:35,density:1.03},{name:'Leche soja',gi:30,carbs:3,kcal:54,density:1.03},{name:'Leche almendra',gi:30,carbs:0.5,kcal:15,density:1.02},
  {name:'Kefir',gi:33,carbs:4,kcal:59},{name:'Requeson',gi:30,carbs:3.4,kcal:98},{name:'Quark',gi:30,carbs:4,kcal:67},
  
  // Frutas
  {name:'Aguacate',gi:15,carbs:8.5,kcal:160},{name:'Manzana',gi:36,carbs:14,kcal:52},{name:'Pera',gi:38,carbs:15,kcal:57},
  {name:'Platano',gi:51,carbs:23,kcal:96},{name:'Fresas',gi:40,carbs:8,kcal:33},{name:'Uvas',gi:46,carbs:17,kcal:69},
  {name:'Naranja',gi:43,carbs:8.3,kcal:47},{name:'Kiwi',gi:52,carbs:15,kcal:61},{name:'Mango',gi:51,carbs:15,kcal:60},
  {name:'Piña',gi:59,carbs:13,kcal:50},{name:'Melon',gi:65,carbs:8,kcal:34},{name:'Sandia',gi:76,carbs:8,kcal:30},
  {name:'Cereza',gi:63,carbs:16,kcal:63},{name:'Papaya',gi:60,carbs:10,kcal:43},{name:'Lima',gi:32,carbs:3.3,kcal:30},
  
  // Verduras y hortalizas
  {name:'Tomate',gi:30,carbs:3.9,kcal:18},{name:'Zanahoria',gi:35,carbs:10,kcal:41},{name:'Cebolla',gi:10,carbs:9,kcal:40},
  {name:'Ajo',gi:30,carbs:33,kcal:149},{name:'Pimiento',gi:15,carbs:6,kcal:31},{name:'Lechuga',gi:15,carbs:2.9,kcal:15},
  {name:'Espinacas',gi:15,carbs:1.1,kcal:23},{name:'Brocoli',gi:10,carbs:7,kcal:34},{name:'Coliflor',gi:10,carbs:5,kcal:25},
  {name:'Champinones',gi:10,carbs:3.3,kcal:22},{name:'Calabacin',gi:15,carbs:3,kcal:17},{name:'Berenjena',gi:15,carbs:6,kcal:25},
  {name:'Maiz dulce',gi:52,carbs:19,kcal:86},{name:'Guisantes',gi:51,carbs:14,kcal:81},
  
  // Frutos secos y semillas
  {name:'Semillas chia',gi:1,carbs:42,kcal:486},{name:'Semillas lino',gi:35,carbs:29,kcal:534},{name:'Almendras',gi:10,carbs:22,kcal:579},
  {name:'Avellanas',gi:15,carbs:17,kcal:628},{name:'Anacardos',gi:22,carbs:30,kcal:553},{name:'Pistachos',gi:15,carbs:28,kcal:562},
  {name:'Nueces',gi:15,carbs:14,kcal:654},{name:'Frutos secos mixtos',gi:20,carbs:30,kcal:600},
  
  // Grasas y condimentos
  {name:'Mantequilla',gi:0,carbs:0.1,kcal:717},{name:'Aceite oliva',gi:0,carbs:0,kcal:884,density:0.91},
  {name:'Mayonesa',gi:0,carbs:0.6,kcal:680},{name:'Salsa soja',gi:15,carbs:5,kcal:53},{name:'Ketchup',gi:55,carbs:22,kcal:112},
  {name:'Mostaza',gi:15,carbs:5,kcal:66},{name:'Mermelada',gi:55,carbs:65,kcal:250},{name:'Tahini',gi:0,carbs:17,kcal:595},
  
  // Suplementos y bebidas
  {name:'Proteina whey',gi:30,carbs:5,kcal:120},{name:'Sopa pollo',gi:15,carbs:3,kcal:40,density:1.02},{name:'Caldo verduras',gi:15,carbs:2,kcal:15,density:1.02},
  {name:'Gazpacho',gi:25,carbs:6,kcal:48,density:1.02},{name:'Cerveza',gi:110,carbs:3.6,kcal:43,density:1.01},{name:'Vino tinto',gi:50,carbs:2.6,kcal:85,density:0.99},
  {name:'Vino blanco',gi:50,carbs:2.6,kcal:82,density:0.99},{name:'Refresco cola',gi:63,carbs:10.6,kcal:42,density:1.04},{name:'Zumo manzana',gi:40,carbs:11,kcal:46,density:1.04},
  {name:'Batido',gi:35,carbs:8,kcal:100,density:1.05},{name:'Cafe',gi:0,carbs:0,kcal:1,density:1.0},{name:'Te',gi:0,carbs:0,kcal:0,density:1.0},
  {name:'Kombucha',gi:50,carbs:3,kcal:15,density:1.02},
  
  // Platos preparados
  {name:'Sushi',gi:55,carbs:28,kcal:200},{name:'Sashimi',gi:0,carbs:0,kcal:99},{name:'Tempura',gi:70,carbs:30,kcal:350},
  {name:'Hamburguesa',gi:50,carbs:10,kcal:295},{name:'Hot dog',gi:52,carbs:20,kcal:290},{name:'Empanada',gi:65,carbs:30,kcal:260},
  {name:'Croissant jamon',gi:67,carbs:45,kcal:406},{name:'Bocadillo jamon',gi:70,carbs:30,kcal:300},{name:'Wrap pollo',gi:50,carbs:25,kcal:220},
  {name:'Ensalada mixta',gi:15,carbs:5,kcal:80},{name:'Poke bowl',gi:55,carbs:45,kcal:420},{name:'Taco',gi:60,carbs:30,kcal:170},
  {name:'Burrito',gi:65,carbs:45,kcal:400},{name:'Nachos',gi:70,carbs:60,kcal:487},{name:'Patatas bravas',gi:78,carbs:30,kcal:200},
  
  // Alimentos adicionales
  {name:'Proteina vegetal',gi:30,carbs:6,kcal:110},{name:'Barrita energetica',gi:65,carbs:60,kcal:350},{name:'Bebida isotonica',gi:78,carbs:6,kcal:25,density:1.04},
  {name:'Salsa bechamel',gi:50,carbs:6,kcal:150},{name:'Pure manzana',gi:70,carbs:18,kcal:68},{name:'Compota',gi:65,carbs:20,kcal:80},
  {name:'Alitas pollo',gi:0,carbs:0,kcal:290},{name:'Pechuga asada',gi:0,carbs:0,kcal:165},{name:'Costillas',gi:0,carbs:0,kcal:360},
  {name:'Pescado frito',gi:0,carbs:0,kcal:220},{name:'Calamares',gi:0,carbs:0,kcal:175},{name:'Mejillones',gi:0,carbs:0,kcal:172},
  {name:'Paella',gi:65,carbs:30,kcal:280},{name:'Arroz negro',gi:65,carbs:30,kcal:290},{name:'Fideua',gi:65,carbs:35,kcal:300},
  {name:'Tortilla francesa',gi:0,carbs:1,kcal:154},{name:'Huevos revueltos',gi:0,carbs:1.5,kcal:160},{name:'Omelette',gi:0,carbs:2,kcal:200},
  {name:'Pudding',gi:65,carbs:20,kcal:150},{name:'Flan',gi:65,carbs:18,kcal:140},{name:'Crema catalana',gi:70,carbs:25,kcal:220},
  
  // Sushi y comida asiática
  {name:'Sushi maki arroz',gi:55,carbs:28,kcal:200},{name:'Sushi california',gi:58,carbs:30,kcal:250},{name:'Onigiri',gi:60,carbs:35,kcal:210},
  {name:'Ramen',gi:70,carbs:40,kcal:430},{name:'Udon',gi:70,carbs:40,kcal:350},{name:'Sopa miso',gi:15,carbs:3,kcal:40},
  {name:'Sopa tom yum',gi:20,carbs:5,kcal:60},{name:'Pad thai',gi:68,carbs:45,kcal:450},{name:'Temaki',gi:58,carbs:30,kcal:280},
  {name:'Sake',gi:60,carbs:4,kcal:134},{name:'Miso',gi:15,carbs:5,kcal:120},{name:'Natto',gi:20,carbs:12,kcal:200},
  
  // Snacks y aperitivos
  {name:'Snacks salados',gi:70,carbs:60,kcal:500},{name:'Palomitas',gi:65,carbs:74,kcal:375},{name:'Pretzels',gi:83,carbs:80,kcal:380},
  {name:'Aceitunas',gi:15,carbs:3,kcal:145},{name:'Pickles',gi:15,carbs:2,kcal:11},{name:'Tapenade',gi:20,carbs:5,kcal:200},
  
  // Salsas y condimentos
  {name:'Salsa pesto',gi:10,carbs:3,kcal:240},{name:'Salsa tomate casera',gi:30,carbs:6,kcal:40},{name:'Salsa barbacoa',gi:60,carbs:20,kcal:120},
  {name:'Salsa curry',gi:35,carbs:8,kcal:90},
  
  // Platos internacionales
  {name:'Brocheta pollo',gi:0,carbs:0,kcal:170},{name:'Brocheta verduras',gi:20,carbs:8,kcal:80},{name:'Ratatouille',gi:20,carbs:10,kcal:120},
  {name:'Lasagna',gi:66,carbs:28,kcal:300},{name:'Cannelloni',gi:64,carbs:30,kcal:320},{name:'Ravioli',gi:65,carbs:32,kcal:330},
  {name:'Polenta',gi:68,carbs:20,kcal:86},{name:'Gnocchi',gi:64,carbs:30,kcal:130},{name:'Berenjena parmigiana',gi:40,carbs:12,kcal:220},
  {name:'Curry pollo',gi:55,carbs:24,kcal:320},{name:'Curry verduras',gi:50,carbs:20,kcal:200},{name:'Cuscus marroqui',gi:65,carbs:23,kcal:112},
  {name:'Tabbouleh',gi:50,carbs:18,kcal:120},{name:'Shawarma',gi:60,carbs:30,kcal:350},{name:'Falafel wrap',gi:60,carbs:40,kcal:420},
  {name:'Shakshuka',gi:30,carbs:15,kcal:220},{name:'Labneh',gi:30,carbs:3,kcal:120},{name:'Arepa',gi:55,carbs:45,kcal:230},
  {name:'Empanada argentina',gi:68,carbs:35,kcal:320},{name:'Tamal',gi:70,carbs:40,kcal:330},{name:'Ceviche',gi:10,carbs:2,kcal:120},
  {name:'Pulpo a la gallega',gi:10,carbs:0,kcal:150},{name:'Bacalao',gi:0,carbs:0,kcal:140},{name:'Croquetas',gi:70,carbs:25,kcal:250},
  {name:'Paté',gi:20,carbs:3,kcal:260},{name:'Foie',gi:15,carbs:2,kcal:462},{name:'Sushi nigiri',gi:55,carbs:28,kcal:200},
  
  // Granos antiguos y alternativos
  {name:'Bulgur',gi:46,carbs:76,kcal:342},{name:'Farro',gi:45,carbs:60,kcal:340},{name:'Semola',gi:65,carbs:70,kcal:360},
  {name:'Triticale',gi:50,carbs:60,kcal:350},{name:'Kamut',gi:45,carbs:70,kcal:360},
  
  // Bebidas alcohólicas
  {name:'Cider',gi:70,carbs:11,kcal:50},{name:'Sidra',gi:70,carbs:11,kcal:50}
];