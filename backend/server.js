// REQUIREMENTS
const { error } = require("console");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { randomUUID } = require("crypto"); // 🔑 Importado para generar códigos
const mysql = require('mysql2/promise'); // 💾 Importar mysql2 con soporte para promesas

const nodeEnv = process.env.NODE_ENV;
let port;
const corsOptions = {};

if (nodeEnv === "production") {
  console.log("Running in production mode");
  port = process.env.PORT || 3001; // El puerto interno para producción
  corsOptions.origin = process.env.FRONTEND_URL || "https://magictyperoyale.daw.inspedralbes.cat";
} else {
  console.log("Running in development mode");
  port = 3001; // Puerto de desarrollo
  // En desarrollo, permite cualquier origen
  corsOptions.origin = "*";
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

// --- CONFIGURACIÓN DE LA BASE DE DATOS ---
const dbConfig = {
  host: process.env.DB_HOST || 'localhost', // Usar la variable de entorno o localhost
  user: process.env.MYSQL_USER || 'trr_user_dev',
  password: process.env.MYSQL_PASSWORD || 'trr_password_dev',
  database: process.env.MYSQL_DATABASE || 'trr_db_dev',
};

let dbConnection;

/**
 * Define la estructura SQL para crear la tabla 'datos_ejemplo'.
 * @type {string}
 */
const CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS datos_ejemplo (
        linea_id INT NOT NULL AUTO_INCREMENT,
        categoria VARCHAR(50) NOT NULL,
        mag INT NOT NULL, 
        linea_orden INT NOT NULL, 
        titol VARCHAR(255) NOT NULL, 
        linea_texto VARCHAR(24) NOT NULL, 
        PRIMARY KEY (linea_id),
        UNIQUE KEY (categoria, mag, linea_orden)
    );
`;

/**
 * Contiene todos los INSERTs de tu base de datos, separados por punto y coma.
 * @type {string}
 */
// Contenido corregido de la variable INITIAL_INSERTS_SQL
const INITIAL_INSERTS_SQL = `
    -- DADES DE LA CATEGORIA: foc
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('foc', 1, 1, 'Foc 1 - Cor del Volcà', 'El cor del volcà batega '),
    ('foc', 1, 2, 'Foc 1 - Cor del Volcà', 'amb una fúria incontro'),
    ('foc', 1, 3, 'Foc 1 - Cor del Volcà', 'lable. El veritable pir'),
    ('foc', 1, 4, 'Foc 1 - Cor del Volcà', 'omant no tem la flama; '),
    ('foc', 1, 5, 'Foc 1 - Cor del Volcà', 'l''abraça, la respira, l'),
    ('foc', 1, 6, 'Foc 1 - Cor del Volcà', 'a converteix en una ext'),
    ('foc', 1, 7, 'Foc 1 - Cor del Volcà', 'ensió de la seva pròpia'),
    ('foc', 1, 8, 'Foc 1 - Cor del Volcà', ' voluntat destructiva. '),
    ('foc', 1, 9, 'Foc 1 - Cor del Volcà', 'La piromància és la màg'),
    ('foc', 1, 10, 'Foc 1 - Cor del Volcà', 'ia de la transformació '),
    ('foc', 1, 11, 'Foc 1 - Cor del Volcà', 'ràpida, un procés que n'),
    ('foc', 1, 12, 'Foc 1 - Cor del Volcà', 'o espera, sinó que cons'),
    ('foc', 1, 13, 'Foc 1 - Cor del Volcà', 'umeix a l''instant. El s'),
    ('foc', 1, 14, 'Foc 1 - Cor del Volcà', 'eu tacte pot encendre l'''),
    ('foc', 1, 15, 'Foc 1 - Cor del Volcà', 'aire. El Foc Arcà és l'''),
    ('foc', 1, 16, 'Foc 1 - Cor del Volcà', 'essència de l''energia p'),
    ('foc', 1, 17, 'Foc 1 - Cor del Volcà', 'ura, extreta directamen'),
    ('foc', 1, 18, 'Foc 1 - Cor del Volcà', 't del pla elemental de '),
    ('foc', 1, 19, 'Foc 1 - Cor del Volcà', 'les brases eternes. El '),
    ('foc', 1, 20, 'Foc 1 - Cor del Volcà', 'món es redueix a cendre'),
    ('foc', 1, 21, 'Foc 1 - Cor del Volcà', 's.                      ');
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('foc', 2, 1, 'Foc 2 - Flama Eterna', 'El coneixement de la Fl'),
    ('foc', 2, 2, 'Foc 2 - Flama Eterna', 'ama Eterna va ser cust'),
    ('foc', 2, 3, 'Foc 2 - Flama Eterna', 'odiat per l''ordre dels '),
    ('foc', 2, 4, 'Foc 2 - Flama Eterna', 'Cinder, que van aprendr'),
    ('foc', 2, 5, 'Foc 2 - Flama Eterna', 'e a canalitzar l''energi'),
    ('foc', 2, 6, 'Foc 2 - Flama Eterna', 'a de la Fúria Incandes'),
    ('foc', 2, 7, 'Foc 2 - Flama Eterna', 'cent sense cremar-se. E'),
    ('foc', 2, 8, 'Foc 2 - Flama Eterna', 'lls sabien que el foc n'),
    ('foc', 2, 9, 'Foc 2 - Flama Eterna', 'o només destrueix, sinó'),
    ('foc', 2, 10, 'Foc 2 - Flama Eterna', ' que també purifica i f'),
    ('foc', 2, 11, 'Foc 2 - Flama Eterna', 'orja el metall i el car'),
    ('foc', 2, 12, 'Foc 2 - Flama Eterna', 'àcter. De les cendres d'),
    ('foc', 2, 13, 'Foc 2 - Flama Eterna', 'el passat s''aixequen el'),
    ('foc', 2, 14, 'Foc 2 - Flama Eterna', 's grans herois, i només'),
    ('foc', 2, 15, 'Foc 2 - Flama Eterna', ' en l''ardor del combat '),
    ('foc', 2, 16, 'Foc 2 - Flama Eterna', 'es revela la veritable '),
    ('foc', 2, 17, 'Foc 2 - Flama Eterna', 'naturalesa d''una ànima.'),
    ('foc', 2, 18, 'Foc 2 - Flama Eterna', ' El mag és un conductor'),
    ('foc', 2, 19, 'Foc 2 - Flama Eterna', ' de la ira del Dracó de'),
    ('foc', 2, 20, 'Foc 2 - Flama Eterna', ' la Muntanya Roja.     ');
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('foc', 3, 1, 'Foc 3 - Profecia', 'L''antiga profecia parla '),
    ('foc', 3, 2, 'Foc 3 - Profecia', 'del dia en què el Dracó'),
    ('foc', 3, 3, 'Foc 3 - Profecia', 'de la Muntanya Roja des'),
    ('foc', 3, 4, 'Foc 3 - Profecia', 'pertarà per devorar el '),
    ('foc', 3, 5, 'Foc 3 - Profecia', 'cel. En aquell moment, '),
    ('foc', 3, 6, 'Foc 3 - Profecia', 'les defenses màgiques d'),
    ('foc', 3, 7, 'Foc 3 - Profecia', 'e les ciutats cauran com'),
    ('foc', 3, 8, 'Foc 3 - Profecia', ' palla seca davant l''alè'),
    ('foc', 3, 9, 'Foc 3 - Profecia', ' de la bèstia. Només aq'),
    ('foc', 3, 10, 'Foc 3 - Profecia', 'uell que domini el Foc '),
    ('foc', 3, 11, 'Foc 3 - Profecia', 'Arcà —el que sorgeix de'),
    ('foc', 3, 12, 'Foc 3 - Profecia', 'l pla elemental mateix—'),
    ('foc', 3, 13, 'Foc 3 - Profecia', ' podrà enfrontar-s''hi i '),
    ('foc', 3, 14, 'Foc 3 - Profecia', 'segellar l''esquerda que'),
    ('foc', 3, 15, 'Foc 3 - Profecia', ' connecta el nostre món '),
    ('foc', 3, 16, 'Foc 3 - Profecia', 'amb l''infern de les bra'),
    ('foc', 3, 17, 'Foc 3 - Profecia', 'ses. El ritual exigeix '),
    ('foc', 3, 18, 'Foc 3 - Profecia', 'el sacrifici de l''Últim'),
    ('foc', 3, 19, 'Foc 3 - Profecia', 'a Gemma Solar. El seu '),
    ('foc', 3, 20, 'Foc 3 - Profecia', 'triomf és inevitable.  ');

    -- DADES DE LA CATEGORIA: foscor
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('foscor', 1, 1, 'Foscor 1 - Nigromant', 'El gran nigromant invoca'),
    ('foscor', 1, 2, 'Foscor 1 - Nigromant', ' la força ancestral que '),
    ('foscor', 1, 3, 'Foscor 1 - Nigromant', 'jeu sota el regne, extre'),
    ('foscor', 1, 4, 'Foscor 1 - Nigromant', 'ient poder del Pla del B'),
    ('foscor', 1, 5, 'Foscor 1 - Nigromant', 'uit. Les ombres millenà'),
    ('foscor', 1, 6, 'Foscor 1 - Nigromant', 'ries s''estenen des de l'''),
    ('foscor', 1, 7, 'Foscor 1 - Nigromant', 'abisme, buscant ànimes '),
    ('foscor', 1, 8, 'Foscor 1 - Nigromant', 'per engolir i voluntats'),
    ('foscor', 1, 9, 'Foscor 1 - Nigromant', ' per doblegar al seu fr'),
    ('foscor', 1, 10, 'Foscor 1 - Nigromant', 'El silenci és la banda '),
    ('foscor', 1, 12, 'Foscor 1 - Nigromant', 'sonora del terror que s'''),
    ('foscor', 1, 13, 'Foscor 1 - Nigromant', 'acosta. La seva invocac'),
    ('foscor', 1, 14, 'Foscor 1 - Nigromant', 'ió és un càntic en una '),
    ('foscor', 1, 15, 'Foscor 1 - Nigromant', 'llengua oblidada, i l''a'),
    ('foscor', 1, 16, 'Foscor 1 - Nigromant', 'ire fa olor d''ozó i des'),
    ('foscor', 1, 17, 'Foscor 1 - Nigromant', 'esperació. La foscor no'),
    ('foscor', 1, 18, 'Foscor 1 - Nigromant', ' és absència, és una pr'),
    ('foscor', 1, 19, 'Foscor 1 - Nigromant', 'esència total i dominan'),
    ('foscor', 1, 20, 'Foscor 1 - Nigromant', 't.                      ');
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('foscor', 2, 1, 'Foscor 2 - El Pacte', 'El pacte final va ser s'),
    ('foscor', 2, 2, 'Foscor 2 - El Pacte', 'egellat amb tinta de ma'),
    ('foscor', 2, 3, 'Foscor 2 - El Pacte', 'lsons en pergamí de pel'),
    ('foscor', 2, 4, 'Foscor 2 - El Pacte', 'l lunar i escrit sota e'),
    ('foscor', 2, 5, 'Foscor 2 - El Pacte', 'l cel sense estrelles. '),
    ('foscor', 2, 6, 'Foscor 2 - El Pacte', 'El mag lliura el seu úl'),
    ('foscor', 2, 7, 'Foscor 2 - El Pacte', 'tim raig de llum i la s'),
    ('foscor', 2, 8, 'Foscor 2 - El Pacte', 'eva memòria a canvi de '),
    ('foscor', 2, 9, 'Foscor 2 - El Pacte', 'dominar el vel de teneb'),
    ('foscor', 2, 10, 'Foscor 2 - El Pacte', 'res. Ara, el seu tacte '),
    ('foscor', 2, 11, 'Foscor 2 - El Pacte', 'congela l''esperança i l'),
    ('foscor', 2, 12, 'Foscor 2 - El Pacte', 'a seva veu és un eco bu'),
    ('foscor', 2, 13, 'Foscor 2 - El Pacte', 'it que ressona en els c'),
    ('foscor', 2, 14, 'Foscor 2 - El Pacte', 'ors dels seus enemics. '),
    ('foscor', 2, 15, 'Foscor 2 - El Pacte', 'Cada pas que fa és una '),
    ('foscor', 2, 16, 'Foscor 2 - El Pacte', 'rendició de la llum. La'),
    ('foscor', 2, 17, 'Foscor 2 - El Pacte', ' seva armadura és l''ombr'),
    ('foscor', 2, 18, 'Foscor 2 - El Pacte', 'a condensada. Qui el mi'),
    ('foscor', 2, 19, 'Foscor 2 - El Pacte', 'ri als ulls veurà només'),
    ('foscor', 2, 20, 'Foscor 2 - El Pacte', ' l''abisme devorador.   ');
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('foscor', 3, 1, 'Foscor 3 - El Vòrtex', 'La nit ha engolit la ll'),
    ('foscor', 3, 2, 'Foscor 3 - El Vòrtex', 'una, i un vòrtex de màg'),
    ('foscor', 3, 3, 'Foscor 3 - El Vòrtex', 'ia negra s''obre sobre l'),
    ('foscor', 3, 4, 'Foscor 3 - El Vòrtex', 'a ciutat, consumint els'),
    ('foscor', 3, 5, 'Foscor 3 - El Vòrtex', ' escuts màgics com si f'),
    ('foscor', 3, 6, 'Foscor 3 - El Vòrtex', 'ossin palla seca. La po'),
    ('foscor', 3, 7, 'Foscor 3 - El Vòrtex', 'r col·lectiva és l''arma'),
    ('foscor', 3, 8, 'Foscor 3 - El Vòrtex', ' suprema, i en la fosco'),
    ('foscor', 3, 9, 'Foscor 3 - El Vòrtex', 'r total, no hi ha heroi'),
    ('foscor', 3, 10, 'Foscor 3 - El Vòrtex', ' ni paladí que pugui di'),
    ('foscor', 3, 11, 'Foscor 3 - El Vòrtex', 'scernir l''atacant de la'),
    ('foscor', 3, 12, 'Foscor 3 - El Vòrtex', ' seva pròpia desesperac'),
    ('foscor', 3, 13, 'Foscor 3 - El Vòrtex', 'ió. L''objectiu no és de'),
    ('foscor', 3, 14, 'Foscor 3 - El Vòrtex', 'struir la vida, sinó ap'),
    ('foscor', 3, 15, 'Foscor 3 - El Vòrtex', 'agar tota flama d''esper'),
    ('foscor', 3, 16, 'Foscor 3 - El Vòrtex', 'ança i alegria. Els esp'),
    ('foscor', 3, 17, 'Foscor 3 - El Vòrtex', 'ectres caminen lliures,'),
    ('foscor', 3, 18, 'Foscor 3 - El Vòrtex', ' ja que la llei de la F'),
    ('foscor', 3, 19, 'Foscor 3 - El Vòrtex', 'oscor regna en aquest m'),
    ('foscor', 3, 20, 'Foscor 3 - El Vòrtex', 'ón de forma permanent. ');

    -- DADES DE LA CATEGORIA: llum
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('llum', 1, 1, 'Llum 1 - Far d''Esperança', 'El clergue canalitza la'),
    ('llum', 1, 2, 'Llum 1 - Far d''Esperança', ' fe en una columna de l'),
    ('llum', 1, 3, 'Llum 1 - Far d''Esperança', 'lum ardent que esquinça'),
    ('llum', 1, 4, 'Llum 1 - Far d''Esperança', ' la foscor com paper. A'),
    ('llum', 1, 5, 'Llum 1 - Far d''Esperança', 'questa energia sagrada '),
    ('llum', 1, 6, 'Llum 1 - Far d''Esperança', 'i radiant dissipa el ve'),
    ('llum', 1, 7, 'Llum 1 - Far d''Esperança', 'l de les il·lusions i pu'),
    ('llum', 1, 8, 'Llum 1 - Far d''Esperança', 'rifica la terra de qual'),
    ('llum', 1, 9, 'Llum 1 - Far d''Esperança', 'sevol taca, pesta o mal'),
    ('llum', 1, 10, 'Llum 1 - Far d''Esperança', 'edicció impura. És la f'),
    ('llum', 1, 11, 'Llum 1 - Far d''Esperança', 'orça de la veritat reve'),
    ('llum', 1, 12, 'Llum 1 - Far d''Esperança', 'lada, un far d''esperanç'),
    ('llum', 1, 13, 'Llum 1 - Far d''Esperança', 'a immutable en la tempe'),
    ('llum', 1, 14, 'Llum 1 - Far d''Esperança', 'sta que no pot ser apag'),
    ('llum', 1, 15, 'Llum 1 - Far d''Esperança', 'at per cap ombra. El se'),
    ('llum', 1, 16, 'Llum 1 - Far d''Esperança', 'u tacte pot curar ferid'),
    ('llum', 1, 17, 'Llum 1 - Far d''Esperança', 'es terminals. La Llum é'),
    ('llum', 1, 18, 'Llum 1 - Far d''Esperança', 's la llei de l''ordre et'),
    ('llum', 1, 19, 'Llum 1 - Far d''Esperança', 'ern i la justícia supre'),
    ('llum', 1, 20, 'Llum 1 - Far d''Esperança', 'ma.                      ');
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('llum', 2, 1, 'Llum 2 - El Campió', 'La benedicció ancestral'),
    ('llum', 2, 2, 'Llum 2 - El Campió', ' cau sobre el campió, '),
    ('llum', 2, 3, 'Llum 2 - El Campió', 'transformant la seva ar'),
    ('llum', 2, 4, 'Llum 2 - El Campió', 'madura de ferro en un m'),
    ('llum', 2, 5, 'Llum 2 - El Campió', 'irall radiant que cega e'),
    ('llum', 2, 6, 'Llum 2 - El Campió', 'ls adversaris nocturns.'),
    ('llum', 2, 7, 'Llum 2 - El Campió', ' La resplendor que emana'),
    ('llum', 2, 8, 'Llum 2 - El Campió', ' del seu cor és l''arma '),
    ('llum', 2, 9, 'Llum 2 - El Campió', 'més pura, capaç de cura'),
    ('llum', 2, 10, 'Llum 2 - El Campió', 'r malalties i de vapor'),
    ('llum', 2, 11, 'Llum 2 - El Campió', 'itzar qualsevol criatur'),
    ('llum', 2, 12, 'Llum 2 - El Campió', 'a espectral amb només un'),
    ('llum', 2, 13, 'Llum 2 - El Campió', 'a mirada. La seva volun'),
    ('llum', 2, 14, 'Llum 2 - El Campió', 'tat és tan ferma com el'),
    ('llum', 2, 15, 'Llum 2 - El Campió', ' diamant, i la seva fe '),
    ('llum', 2, 16, 'Llum 2 - El Campió', 'és el seu escut. L''enfr'),
    ('llum', 2, 17, 'Llum 2 - El Campió', 'ontament contra la Llum'),
    ('llum', 2, 18, 'Llum 2 - El Campió', ' és sempre un acte de d'),
    ('llum', 2, 19, 'Llum 2 - El Campió', 'esesesperació per part '),
    ('llum', 2, 20, 'Llum 2 - El Campió', 'de la Foscor.          ');
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('llum', 3, 1, 'Llum 3 - Càstig Diví', 'La llum no coneix la ma'),
    ('llum', 3, 2, 'Llum 3 - Càstig Diví', 'lícia, però el seu pode'),
    ('llum', 3, 3, 'Llum 3 - Càstig Diví', 'r de judici és absolut '),
    ('llum', 3, 4, 'Llum 3 - Càstig Diví', 'i imparable. El seu ava'),
    ('llum', 3, 5, 'Llum 3 - Càstig Diví', 'nç és implacable; davant'),
    ('llum', 3, 6, 'Llum 3 - Càstig Diví', ' la seva presència, les'),
    ('llum', 3, 7, 'Llum 3 - Càstig Diví', ' ombres es repleguen i e'),
    ('llum', 3, 8, 'Llum 3 - Càstig Diví', 'l caos s''atura. El conju'),
    ('llum', 3, 9, 'Llum 3 - Càstig Diví', 'r és un encanteri de rev'),
    ('llum', 3, 10, 'Llum 3 - Càstig Diví', 'elació. El mag de la Ll'),
    ('llum', 3, 11, 'Llum 3 - Càstig Diví', 'um s''envolta en una aura'),
    ('llum', 3, 12, 'Llum 3 - Càstig Diví', ' que fortifica la volunt'),
    ('llum', 3, 13, 'Llum 3 - Càstig Diví', 'at dels seus aliats i de'),
    ('llum', 3, 14, 'Llum 3 - Càstig Diví', 'bilita la moral de l''ene'),
    ('llum', 3, 15, 'Llum 3 - Càstig Diví', 'mic. És la promesa d''un'),
    ('llum', 3, 16, 'Llum 3 - Càstig Diví', ' món sense enganys, on c'),
    ('llum', 3, 17, 'Llum 3 - Càstig Diví', 'ada acció serà jutjada p'),
    ('llum', 3, 18, 'Llum 3 - Càstig Diví', 'el sol. El mal no es po'),
    ('llum', 3, 19, 'Llum 3 - Càstig Diví', 't amagar d''ella.       '),
    ('llum', 3, 20, 'Llum 3 - Càstig Diví', 't amagar d''ella.       ');

    -- DADES DE LA CATEGORIA: gel
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('gel', 1, 1, 'Gel 1 - El Glaçal', 'El vent del nord porta '),
    ('gel', 1, 2, 'Gel 1 - El Glaçal', 'amb ell l''alè del glaça'),
    ('gel', 1, 3, 'Gel 1 - El Glaçal', 'l etern. El mag de gel '),
    ('gel', 1, 4, 'Gel 1 - El Glaçal', 'aixeca la mà i l''aire e'),
    ('gel', 1, 5, 'Gel 1 - El Glaçal', 's transforma en agulles'),
    ('gel', 1, 6, 'Gel 1 - El Glaçal', ' de cristall, creant un'),
    ('gel', 1, 7, 'Gel 1 - El Glaçal', 'a tempesta estàtica. La'),
    ('gel', 1, 8, 'Gel 1 - El Glaçal', ' gebrada cobreix la maq'),
    ('gel', 1, 9, 'Gel 1 - El Glaçal', 'uinària de l''enemic, at'),
    ('gel', 1, 10, 'Gel 1 - El Glaçal', 'urant-ne l''avanç i la v'),
    ('gel', 1, 11, 'Gel 1 - El Glaçal', 'oluntat de lluita per i'),
    ('gel', 1, 12, 'Gel 1 - El Glaçal', 'gual. Aquest poder no b'),
    ('gel', 1, 13, 'Gel 1 - El Glaçal', 'usca la destrucció per '),
    ('gel', 1, 14, 'Gel 1 - El Glaçal', 'calor, sinó la immobili'),
    ('gel', 1, 15, 'Gel 1 - El Glaçal', 'tat per fred absolut. C'),
    ('gel', 1, 16, 'Gel 1 - El Glaçal', 'ada cristall de gel con'),
    ('gel', 1, 17, 'Gel 1 - El Glaçal', 'té la memòria d''una era'),
    ('gel', 1, 18, 'Gel 1 - El Glaçal', ' geològica. El cerç és '),
    ('gel', 1, 19, 'Gel 1 - El Glaçal', 'un aliat silenciós.    '),
    ('gel', 1, 20, 'Gel 1 - El Glaçal', 'un aliat silenciós.    ');
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('gel', 2, 1, 'Gel 2 - Mur de Gebrada', 'Un mur de gel pur s''aix'),
    ('gel', 2, 2, 'Gel 2 - Mur de Gebrada', 'eca del terra, impenet'),
    ('gel', 2, 3, 'Gel 2 - Mur de Gebrada', 'rable i completament tr'),
    ('gel', 2, 4, 'Gel 2 - Mur de Gebrada', 'ansparent, reflectint l'),
    ('gel', 2, 5, 'Gel 2 - Mur de Gebrada', 'a llum del sol per conf'),
    ('gel', 2, 6, 'Gel 2 - Mur de Gebrada', 'ondre i cegar els atac'),
    ('gel', 2, 7, 'Gel 2 - Mur de Gebrada', 'ants. Aquest poder no b'),
    ('gel', 2, 8, 'Gel 2 - Mur de Gebrada', 'usca la demolició, sinó'),
    ('gel', 2, 9, 'Gel 2 - Mur de Gebrada', ' la detenció total. El '),
    ('gel', 2, 10, 'Gel 2 - Mur de Gebrada', 'cor del mag és tan fred'),
    ('gel', 2, 11, 'Gel 2 - Mur de Gebrada', ' com el glaçal del qual'),
    ('gel', 2, 12, 'Gel 2 - Mur de Gebrada', ' extreu la seva energia'),
    ('gel', 2, 13, 'Gel 2 - Mur de Gebrada', '. Els seus enemics es co'),
    ('gel', 2, 14, 'Gel 2 - Mur de Gebrada', 'nverteixen en estàtues '),
    ('gel', 2, 15, 'Gel 2 - Mur de Gebrada', 'de gebrada que cauen am'),
    ('gel', 2, 16, 'Gel 2 - Mur de Gebrada', 'b el primer toc. L''encan'),
    ('gel', 2, 17, 'Gel 2 - Mur de Gebrada', 'teri de congelació és i'),
    ('gel', 2, 18, 'Gel 2 - Mur de Gebrada', 'rreversible. El silenci'),
    ('gel', 2, 19, 'Gel 2 - Mur de Gebrada', ' gèlid és el triomf fina'),
    ('gel', 2, 20, 'Gel 2 - Mur de Gebrada', 'l.                      ');
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('gel', 3, 1, 'Gel 3 - Tundra', 'La bruixa invoca un esp'),
    ('gel', 3, 2, 'Gel 3 - Tundra', 'erit elemental de la tu'),
    ('gel', 3, 3, 'Gel 3 - Tundra', 'ndra congelada. Aquesta'),
    ('gel', 3, 4, 'Gel 3 - Tundra', ' criatura de gebrada i '),
    ('gel', 3, 5, 'Gel 3 - Tundra', 'torb obeïx cegament, co'),
    ('gel', 3, 6, 'Gel 3 - Tundra', 'nvertint el camp de bat'),
    ('gel', 3, 7, 'Gel 3 - Tundra', 'alla en un erm blanc on'),
    ('gel', 3, 8, 'Gel 3 - Tundra', ' cada pas és relliscós '),
    ('gel', 3, 9, 'Gel 3 - Tundra', 'i cada respiració crem'),
    ('gel', 3, 10, 'Gel 3 - Tundra', 'a els pulmons. El poder'),
    ('gel', 3, 11, 'Gel 3 - Tundra', ' de la neu és la cobert'),
    ('gel', 3, 12, 'Gel 3 - Tundra', 'ura perfecta. L''heroi s'),
    ('gel', 3, 13, 'Gel 3 - Tundra', 'ucumbeix lentament, atr'),
    ('gel', 3, 14, 'Gel 3 - Tundra', 'apat en un laberint de '),
    ('gel', 3, 15, 'Gel 3 - Tundra', 'ventisca i boira. El do'),
    ('gel', 3, 16, 'Gel 3 - Tundra', 'mini del Gel és el domi'),
    ('gel', 3, 17, 'Gel 3 - Tundra', 'ni del temps aturat. La'),
    ('gel', 3, 18, 'Gel 3 - Tundra', ' seva força és la paciè'),
    ('gel', 3, 19, 'Gel 3 - Tundra', 'ncia.                  '),
    ('gel', 3, 20, 'Gel 3 - Tundra', 'ncia.                  ');

    -- DADES DE LA CATEGORIA: aigua
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('aigua', 1, 1, 'Aigua 1 - El Torrent', 'El riu de la vida és ta'),
    ('aigua', 1, 2, 'Aigua 1 - El Torrent', 'mbé el torrent de la de'),
    ('aigua', 1, 3, 'Aigua 1 - El Torrent', 'strucció imparable. La '),
    ('aigua', 1, 4, 'Aigua 1 - El Torrent', 'hidromant entén la paci'),
    ('aigua', 1, 5, 'Aigua 1 - El Torrent', 'ència de l''aigua, que po'),
    ('aigua', 1, 6, 'Aigua 1 - El Torrent', 't erosionar la muntanya '),
    ('aigua', 1, 7, 'Aigua 1 - El Torrent', 'més alta amb només un de'),
    ('aigua', 1, 8, 'Aigua 1 - El Torrent', 'goteig constant. Una bo'),
    ('aigua', 1, 9, 'Aigua 1 - El Torrent', 'ira espessa envolta els'),
    ('aigua', 1, 10, 'Aigua 1 - El Torrent', ' enemics, desorientant-l'),
    ('aigua', 1, 11, 'Aigua 1 - El Torrent', 'os completament abans q'),
    ('aigua', 1, 12, 'Aigua 1 - El Torrent', 'ue una onada gegant tren'),
    ('aigua', 1, 13, 'Aigua 1 - El Torrent', 'qui les seves files sens'),
    ('aigua', 1, 14, 'Aigua 1 - El Torrent', 'e esforç. El mar és el '),
    ('aigua', 1, 15, 'Aigua 1 - El Torrent', 'dipositari de tots els s'),
    ('aigua', 1, 16, 'Aigua 1 - El Torrent', 'ecrets i la memòria de l'),
    ('aigua', 1, 17, 'Aigua 1 - El Torrent', 'es eres, i ella extreu '),
    ('aigua', 1, 18, 'Aigua 1 - El Torrent', 'aquesta saviesa ancestr'),
    ('aigua', 1, 19, 'Aigua 1 - El Torrent', 'al. La força és a la fl'),
    ('aigua', 1, 20, 'Aigua 1 - El Torrent', 'uïdesa.                 ');
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('aigua', 2, 1, 'Aigua 2 - La Mareia', 'El mar guarda secrets i '),
    ('aigua', 2, 2, 'Aigua 2 - La Mareia', 'la memòria de les eres.'),
    ('aigua', 2, 3, 'Aigua 2 - La Mareia', ' El mag extreu aquesta '),
    ('aigua', 2, 4, 'Aigua 2 - La Mareia', 'saviesa, creant esferes'),
    ('aigua', 2, 5, 'Aigua 2 - La Mareia', ' de líquid pur que actu'),
    ('aigua', 2, 6, 'Aigua 2 - La Mareia', 'en com a prismes defen'),
    ('aigua', 2, 7, 'Aigua 2 - La Mareia', 'sius, refractant la màg'),
    ('aigua', 2, 8, 'Aigua 2 - La Mareia', 'ia enemiga. L''aigua és '),
    ('aigua', 2, 9, 'Aigua 2 - La Mareia', 'adaptable i etèria: pre'),
    ('aigua', 2, 10, 'Aigua 2 - La Mareia', 'n la forma del contenid'),
    ('aigua', 2, 11, 'Aigua 2 - La Mareia', 'or, però la seva força '),
    ('aigua', 2, 12, 'Aigua 2 - La Mareia', 'no pot ser continguda p'),
    ('aigua', 2, 13, 'Aigua 2 - La Mareia', 'er ningú. La mareia és '),
    ('aigua', 2, 14, 'Aigua 2 - La Mareia', 'la seva arma més temuda'),
    ('aigua', 2, 15, 'Aigua 2 - La Mareia', '. La pluja màgica cau c'),
    ('aigua', 2, 16, 'Aigua 2 - La Mareia', 'om un diluvi curatiu pe'),
    ('aigua', 2, 17, 'Aigua 2 - La Mareia', 'r als aliats, però es tr'),
    ('aigua', 2, 18, 'Aigua 2 - La Mareia', 'ansforma en àcid per al'),
    ('aigua', 2, 19, 'Aigua 2 - La Mareia', 's enemics de la natura.'),
    ('aigua', 2, 20, 'Aigua 2 - La Mareia', 's enemics de la natura.');
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('aigua', 3, 1, 'Aigua 3 - Sirena', 'La gran mareia s''aixeca'),
    ('aigua', 3, 2, 'Aigua 3 - Sirena', ' per ordre de la siren'),
    ('aigua', 3, 3, 'Aigua 3 - Sirena', 'a bruixa, arrossegant e'),
    ('aigua', 3, 4, 'Aigua 3 - Sirena', 'ls soldats i les seves '),
    ('aigua', 3, 5, 'Aigua 3 - Sirena', 'pesades armes de metal'),
    ('aigua', 3, 6, 'Aigua 3 - Sirena', 'l cap al fons. El poder'),
    ('aigua', 3, 7, 'Aigua 3 - Sirena', ' de l''aigua no tem la c'),
    ('aigua', 3, 8, 'Aigua 3 - Sirena', 'orrupció; la purifica. '),
    ('aigua', 3, 9, 'Aigua 3 - Sirena', 'El domini de l''aigua és'),
    ('aigua', 3, 10, 'Aigua 3 - Sirena', ' el domini de les emoc'),
    ('aigua', 3, 11, 'Aigua 3 - Sirena', 'ions i el flux constant'),
    ('aigua', 3, 12, 'Aigua 3 - Sirena', ' de la vida. La bruixa '),
    ('aigua', 3, 13, 'Aigua 3 - Sirena', 'pot transformar el seu '),
    ('aigua', 3, 14, 'Aigua 3 - Sirena', 'propi cos en un torrent'),
    ('aigua', 3, 15, 'Aigua 3 - Sirena', ' indomable. Cada gota de'),
    ('aigua', 3, 16, 'Aigua 3 - Sirena', ' rosada té la promesa d'),
    ('aigua', 3, 17, 'Aigua 3 - Sirena', 'el renaixement. L''aigua'),
    ('aigua', 3, 18, 'Aigua 3 - Sirena', ' és el destí final de t'),
    ('aigua', 3, 19, 'Aigua 3 - Sirena', 'ota matèria.          '),
    ('aigua', 3, 20, 'Aigua 3 - Sirena', 'ota matèria.          ');

    -- DADES DE LA CATEGORIA: selva
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('selva', 1, 1, 'Selva 1 - El Druida', 'El druida es fon amb el'),
    ('selva', 1, 2, 'Selva 1 - El Druida', ' follatge, escoltant el'),
    ('selva', 1, 3, 'Selva 1 - El Druida', ' pol lent i poderós de l'),
    ('selva', 1, 4, 'Selva 1 - El Druida', 'a terra. Les arrels s''a'),
    ('selva', 1, 5, 'Selva 1 - El Druida', 'ixequen com serps venja'),
    ('selva', 1, 6, 'Selva 1 - El Druida', 'dores, empresonant els '),
    ('selva', 1, 7, 'Selva 1 - El Druida', 'intrusos que van gosar '),
    ('selva', 1, 8, 'Selva 1 - El Druida', 'pertorbar la pau del bo'),
    ('selva', 1, 9, 'Selva 1 - El Druida', 'sc sagrat. La selva és '),
    ('selva', 1, 10, 'Selva 1 - El Druida', 'un organisme viu que ll'),
    ('selva', 1, 11, 'Selva 1 - El Druida', 'uita per defensar la se'),
    ('selva', 1, 12, 'Selva 1 - El Druida', 'va pròpia existència amb'),
    ('selva', 1, 13, 'Selva 1 - El Druida', ' cada fulla, branca i es'),
    ('selva', 1, 14, 'Selva 1 - El Druida', 'pina. El coneixement de'),
    ('selva', 1, 15, 'Selva 1 - El Druida', ' les plantes verinoses l'),
    ('selva', 1, 16, 'Selva 1 - El Druida', 'i atorga el poder de la'),
    ('selva', 1, 17, 'Selva 1 - El Druida', ' subtilesa. El verd és '),
    ('selva', 1, 18, 'Selva 1 - El Druida', 'un color de poder absol'),
    ('selva', 1, 19, 'Selva 1 - El Druida', 'ut i indomable.        '),
    ('selva', 1, 20, 'Selva 1 - El Druida', 'ut i indomable.        ');
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('selva', 2, 1, 'Selva 2 - El Verí', 'Un verí subtil i floral'),
    ('selva', 2, 2, 'Selva 2 - El Verí', ' és destil·lat per la br'),
    ('selva', 2, 3, 'Selva 2 - El Verí', 'uixa del bosc. No és un'),
    ('selva', 2, 4, 'Selva 2 - El Verí', 'a toxina ràpida, sinó u'),
    ('selva', 2, 5, 'Selva 2 - El Verí', 'na que adorm la voluntat'),
    ('selva', 2, 6, 'Selva 2 - El Verí', ' i confon el judici, fen'),
    ('selva', 2, 7, 'Selva 2 - El Verí', 't que l''enemic ataqui el'),
    ('selva', 2, 8, 'Selva 2 - El Verí', 's seus propis aliats. L'),
    ('selva', 2, 9, 'Selva 2 - El Verí', 'es branques formen un s'),
    ('selva', 2, 10, 'Selva 2 - El Verí', 'ostre impenetrable que '),
    ('selva', 2, 11, 'Selva 2 - El Verí', 'roba la llum del sol, s'),
    ('selva', 2, 12, 'Selva 2 - El Verí', 'ubmergint el camp en un'),
    ('selva', 2, 13, 'Selva 2 - El Verí', 'a penombra eterna i caò'),
    ('selva', 2, 14, 'Selva 2 - El Verí', 'tica. El camuflatge és '),
    ('selva', 2, 15, 'Selva 2 - El Verí', 'la seva millor defensa.'),
    ('selva', 2, 16, 'Selva 2 - El Verí', ' La molsa cura mentre l'),
    ('selva', 2, 17, 'Selva 2 - El Verí', 'es enfiladisses escany'),
    ('selva', 2, 18, 'Selva 2 - El Verí', 'en. La natura no és ni '),
    ('selva', 2, 19, 'Selva 2 - El Verí', 'bona ni dolenta; és lle'),
    ('selva', 2, 20, 'Selva 2 - El Verí', 'i.                      ');
    INSERT IGNORE INTO datos_ejemplo (categoria, mag, linea_orden, titol, linea_texto) VALUES
    ('selva', 3, 1, 'Selva 3 - L''Esperit', 'L''esperit de l''arbre més'),
    ('selva', 3, 2, 'Selva 3 - L''Esperit', ' antic desperta per a l'),
    ('selva', 3, 3, 'Selva 3 - L''Esperit', 'a batalla. Les seves br'),
    ('selva', 3, 4, 'Selva 3 - L''Esperit', 'anques són maces contun'),
    ('selva', 3, 5, 'Selva 3 - L''Esperit', 'dents i la seva escorça'),
    ('selva', 3, 6, 'Selva 3 - L''Esperit', ' és una armadura de ped'),
    ('selva', 3, 7, 'Selva 3 - L''Esperit', 'ra viva. La màgia de la'),
    ('selva', 3, 8, 'Selva 3 - L''Esperit', ' selva és la llei de la'),
    ('selva', 3, 9, 'Selva 3 - L''Esperit', ' supervivència; només e'),
    ('selva', 3, 10, 'Selva 3 - L''Esperit', 'l més apte, aquell en h'),
    ('selva', 3, 11, 'Selva 3 - L''Esperit', 'armonia amb la natura, '),
    ('selva', 3, 12, 'Selva 3 - L''Esperit', 'prevaldrà. Els animals '),
    ('selva', 3, 13, 'Selva 3 - L''Esperit', 'salvatges obeeixen la s'),
    ('selva', 3, 14, 'Selva 3 - L''Esperit', 'eva crida, formando un e'),
    ('selva', 3, 15, 'Selva 3 - L''Esperit', 'xèrcit instintiu i vor'),
    ('selva', 3, 16, 'Selva 3 - L''Esperit', 'aç. El druida és el gua'),
    ('selva', 3, 17, 'Selva 3 - L''Esperit', 'rdià dels cicles. El bo'),
    ('selva', 3, 18, 'Selva 3 - L''Esperit', 'sc sempre reclama el qu'),
    ('selva', 3, 19, 'Selva 3 - L''Esperit', 'e és seu al final de to'),
    ('selva', 3, 20, 'Selva 3 - L''Esperit', 'ta contesa.            ');
`;

/**
 * Función para crear la tabla si no existe y poblar con datos.
 */
async function initializeDatabase() {
  if (!dbConnection) {
    console.error("No hay conexión a la base de datos, omitiendo inicialización.");
    return;
  }
  const tableName = 'datos_ejemplo';

  try {
    console.log(`Verificando la tabla '${tableName}'...`);
    // 1. Crear la tabla si no existe (usando IF NOT EXISTS)
    await dbConnection.execute(CREATE_TABLE_SQL);
    console.log(`Tabla '${tableName}' asegurada.`);

    // 2. Comprobar si ya hay datos
    const [rows] = await dbConnection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
    const count = rows[0].count;

    if (count === 0) {
      console.log(`Tabla '${tableName}' vacía. Insertando datos iniciales...`);

      // 3. Ejecutar los INSERTs. 
      // Utilizamos INSERT IGNORE INTO en el SQL para evitar duplicados 
      // si la clave UNIQUE KEY (categoria, mag, linea_orden) ya existiera.

      // Dividir los comandos SQL por el delimitador ';'
      const insertStatements = INITIAL_INSERTS_SQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let insertsCount = 0;
      for (const statement of insertStatements) {
        // Añadimos punto y coma al final de cada statement para que sea una query válida
        await dbConnection.execute(statement + ';');
        insertsCount++;
      }

      console.log(`¡Datos iniciales insertados exitosamente! Total de ${insertsCount} filas.`);
    } else {
      console.log(`Tabla '${tableName}' ya contiene ${count} filas. Inicialización omitida.`);
    }
  } catch (err) {
    console.error("Error durante la inicialización de la base de datos:", err);
  }
}


async function connectToDatabase() {
  try {
    dbConnection = await mysql.createConnection(dbConfig);
    console.log("Conectado a la base de datos MySQL exitosamente! 💾");

    // 🔑 LLAMAR A LA FUNCIÓN DE INICIALIZACIÓN AQUÍ
    await initializeDatabase();

  } catch (err) {
    console.error("Error al conectar con la base de datos MySQL:", err);
    // En un entorno real, aquí deberías manejar reintentos o un mensaje de error más robusto.
  }
}

connectToDatabase();
// ----------------------------------------

app.get("/", (req, res) => res.send("Type Racer Royale backend ready 🏁"));

let rooms = [];
// Mapea el mago (name) con su categoría (category) de la BDD. 
// He añadido categorías asumidas para los magos que no son 'Foc' basándome en los ejemplos típicos.
const mageDefinitions = [
  {
    name: "Mag de Foc",
    category: "foc", // 🔑 Coincide con tu ejemplo 'foc'
    powerUp: "Ignicio",
    description: "Posa tilde a totes les lletres",
  },
  {
    name: "Mag de Gel",
    category: "gel", // 🔑 CORRECCIÓN: Coincide con 'gel' en la BDD
    powerUp: "Congelar",
    description: "Congela l'input no saps en quina palabra et trobes",
  },
  {
    name: "Mag d'Aigua",
    category: "aigua", // 🔑 CORRECCIÓN: Coincide con 'aigua' en la BDD
    powerUp: "Tsunami",
    description:
      "Si no escrius la paraula que toca tens que tornar a escriure tota la frase",
  },
  {
    name: "Mag Oscur",
    category: "foscor", // 🔑 CORRECCIÓN: Coincide con 'foscor' en la BDD
    powerUp: "Apagon",
    description: "Torna tota la pantalla molt oscura ",
  },
  {
    name: "Mag de Llum",
    category: "llum", // 🔑 CORRECCIÓN: Coincide con 'llum' en la BDD
    powerUp: "Flash",
    description: "Ilumina la pantalla de forma intermitent",
  },
  {
    name: "Mag de Jungla",
    category: "selva", // 🔑 CORRECCIÓN: Coincide con 'selva' en la BDD
    powerUp: "Enredadera",
    description: "Posa a tota una paraula plena de caràcters especials",
  },
];

//Funció per sortejar als mags
function getRandomMage() {
  return mageDefinitions[Math.floor(Math.random() * mageDefinitions.length)];
}

// ----------------------------------------------------
// NUEVA FUNCIÓN: Obtener textos de la BDD
// ----------------------------------------------------
async function getRandomSpellText(category, limit = null) {
  if (!dbConnection) return null;

  try {
    // 1. Obtener una lista de TÍTULOS y MAG (nivel/id numérico) únicos para esa categoría.
    const [titles] = await dbConnection.execute(
      `SELECT DISTINCT titol, mag FROM datos_ejemplo WHERE categoria = ?`,
      [category]
    );

    if (titles.length === 0) {
      console.warn(`No se encontraron conjuros para la categoría: ${category}`);
      return null;
    }

    // 2. Elegir un conjuro (titol/mag) aleatorio
    const randomTitleIndex = Math.floor(Math.random() * titles.length);
    const { titol, mag: rawMag } = titles[randomTitleIndex];
    const mag = parseInt(rawMag, 10); // Explicitly cast to integer
    if (isNaN(mag)) {
      console.error(`[ERROR] 'mag' is NaN for category: ${category}, titol: ${titol}, rawMag: ${rawMag}`);
      return null;
    }

    // 3. Obtener todas las líneas de texto para ese conjuro, ordenadas por linea_orden.
    let query = `SELECT linea_texto FROM datos_ejemplo WHERE categoria = ? AND titol = ? AND mag = ? ORDER BY linea_orden ASC`;
    const params = [category, titol, mag];

    if (limit) {
      const numericLimit = parseInt(limit, 10); // Explicitly cast to integer
      if (isNaN(numericLimit)) {
        console.error(`[ERROR] 'limit' is NaN for category: ${category}, titol: ${titol}, limit: ${limit}`);
        return null;
      }
      query += ` LIMIT ${numericLimit}`;
    }

    console.log(`[DEBUG] Query for spell text: ${query}`);
    console.log(`[DEBUG] Parameters for spell text: ${JSON.stringify(params)}`);

    const [lines] = await dbConnection.execute(query, params);

    // 4. Mapear el resultado para obtener solo un array de strings (las líneas de texto)
    const textLines = lines.map(row => row.linea_texto.trim());

    console.log(`Conjuro seleccionado para ${category}: ${titol} (Mag: ${mag}). Líneas: ${textLines.length}`);
    return textLines; // 🔑 CORRECCIÓN: Faltaba este return. Sin él, la función devolvía undefined.

  } catch (error) {
    console.error("Error al obtener el texto del conjuro:", error);
    return null; // En caso de error, devuelve null
  }
}
// ----------------------------------------------------

//Funció per asignar admin
function assignNewAdmin(room) {
  if (room.players.length === 0) return;

  let newAdmin = null;

  if (room.beingPlayed) {
    newAdmin = room.players.find((p) => p.role !== "spectator");
  } else {
    newAdmin = room.players[0];
  }

  if (newAdmin) {
    newAdmin.role = "admin";
    io.to(newAdmin.socketId).emit("youAreNowAdmin");
  } // Si els que queden només son espectadors els jugadors la sala es queda temporalment sense admin fins que acabi el joc ja que en EndGame es reasigna
}

// Funció per crear rooms
function createRoom(roomName, hostPlayer, isPrivate = false) {
  const room = {
    name: roomName,
    beingPlayed: false,
    config: { language: "cat", time: 60 },
    players: [hostPlayer],
    timer: null,
    isPrivate: isPrivate,
    accessCode: isPrivate ? randomUUID().substring(0, 6).toUpperCase() : null, // Código de 6 caracteres

    // --- NUEVAS PROPIEDADES ---
    gameStats: [], // Para guardar el progreso de cada jugador
    spectatorIds: [], // Para saber a quién enviar los datos
    spellText: [], // 🔑 Guardaremos el texto (array de líneas) del conjuro
    // -------------------------
  };
  rooms.push(room);
  broadcastRoomList();
  return room;
}

// Trobar la Room per el seu nom
function findRoom(roomName) {
  return rooms.find((r) => r.name === roomName);
}

// Trobar la Room per el seu codi d'accés
function findRoomByCode(accessCode) {
  if (!accessCode) return null;
  const upperCaseCode = accessCode.toUpperCase();
  return rooms.find((r) => r.accessCode === upperCaseCode);
}

// Enviar l'estat actualitzar de la sala a tots en la sala
function broadcastRoomState(roomName) {
  const room = findRoom(roomName);
  if (room) {
    const { timer, ...roomState } = room;
    io.to(roomName).emit("updateRoomState", roomState);
  }
}

// Solo enviamos salas públicas en la lista
function broadcastRoomList() {
  const roomList = rooms
    .filter((r) => !r.isPrivate)
    .map((r) => ({
      name: r.name,
      playerCount: r.players.length,
      beingPlayed: r.beingPlayed,
    }));
  io.emit("roomList", roomList);
}

//Eliminar Rooms sense cap jugador
function removeEmptyRooms() {
  const before = rooms.length;
  rooms = rooms.filter((room) => room.players.length > 0);
  if (rooms.length !== before) {
    broadcastRoomList();
  }
}

// Function to end the game and send the final ranking
function endGame(roomName) {
  const room = findRoom(roomName);
  if (!room) return;

  room.beingPlayed = false;

  const ranking = [...room.players]
    .filter((player) => player.role === "player" || player.role === "admin")
    .sort((a, b) => b.points - a.points || a.errors - b.errors);

  //netejem els stats
  room.gameStats = [];
  room.spectatorIds = [];
  room.spellText = []; // 🔑 Limpiar el texto del conjuro

  let adminExists = false;

  // Resetear roles de espectadores que eran players antes del juego
  room.players.forEach((p) => {
    p.debuff = { type: null, duration: 0 };
    if (p.role === "admin") {
      adminExists = true;
      p.isReady = true;
    } else if (p.role === "spectator") {
      // Si era espectador, pasa al lobby com jugador,
      p.role = "player";
      p.isReady = true;
    } else {
      p.role = "player";
      p.isReady = true;
    }
  });

  if (!adminExists && room.players.length > 0) {
    room.players[0].role = "admin";
    room.players[0].isReady = true;
    io.to(room.players[0].socketId).emit("youAreNowAdmin");
  }

  io.to(roomName).emit("gameFinished", { ranking });

  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
  broadcastRoomState(roomName);
  broadcastRoomList();
  removeEmptyRooms();
}

// Enviem el rànquing actualitzat
function broadcastRanking(roomName) {
  const room = findRoom(roomName);
  if (!room) return;

  const ranking = [...room.players]
    .filter((p) => p.role !== "spectator")
    .sort((a, b) => b.points - a.points || a.errors - b.errors);

  io.to(roomName).emit("updateRanking", ranking);
}

// Start listening for server connections
io.on("connection", (socket) => {
  console.log("Player connected");

  // When a user sends their name and ID
  socket.on("setPlayerName", ({ name, id }) => {
    if (!name || id === undefined) return;

    socket.data.player = {
      id: id,
      socketId: socket.id,
      name: name,
      role: "player",
      isReady: true,
      points: 0,
      errors: 0,

      //powerups
      mage: null,
      powerUpEarned: false,
      correctWordsInARow: 0,
      debuff: { type: null, duration: 0 },
    };

    console.log(`Jugador conectado: ${name} (${id})`);
    socket.emit("playerRegistered", socket.data.player);
  });

  // Listener para crear sala
  socket.on("createRoom", ({ roomName, isPrivate = false }) => {
    const player = socket.data.player;
    if (!player)
      return socket.emit("error", { message: "Jugador no registrado." });
    if (findRoom(roomName))
      return socket.emit("error", { message: "La sala ya existe." });

    player.role = "admin";
    const room = createRoom(roomName, player, isPrivate);

    socket.join(roomName);
    broadcastRoomState(roomName);

    console.log(
      `${player.name} creó la sala ${roomName} (Privada: ${isPrivate})`
    );
  });

  // Listener para unirse a sala (por nombre o código)
  socket.on("joinRoom", ({ roomName, accessCode }) => {
    const player = socket.data.player;
    if (!player)
      return socket.emit("error", { message: "Jugador no registrado." });

    let room;
    const codeToSearch = accessCode ? accessCode.toUpperCase() : null;

    if (codeToSearch) {
      room = findRoomByCode(codeToSearch);
    } else if (roomName) {
      room = findRoom(roomName);
    }

    if (!room)
      return socket.emit("error", {
        message: "Sala no encontrada o código incorrecto.",
      });

    if (room.isPrivate) {
      if (!codeToSearch || room.accessCode !== codeToSearch) {
        return socket.emit("error", {
          message: "Código de acceso incorrecto.",
        });
      }
    } else {
      if (codeToSearch) {
        return socket.emit("error", {
          message: "Error en la unión. Esta sala no requiere código.",
        });
      }
    }

    if (room.players.length >= 6)
      return socket.emit("error", { message: "La sala está plena" });

    if (room.beingPlayed) {
      player.role = "spectator";

      if (!room.spectatorIds.includes(player.id)) {
        room.spectatorIds.push(player.id);
      }
    }

    player.isReady = true;
    player.points = 0;
    player.errors = 0;

    room.players.push(player);
    socket.join(room.name);

    if (codeToSearch) {
      socket.emit("roomJoined", { roomName: room.name });
    }

    broadcastRoomState(room.name);
    broadcastRoomList();
    console.log(`${player.name} se unió a ${room.name}`);
  });

  socket.on("getRoomList", () => {
    broadcastRoomList();
  });

  // Listo / No Listo
  socket.on("setIsReady", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player) return;

    player.isReady = !player.isReady;
    broadcastRoomState(roomName);
  });

  // Configuración de juego (se mantiene)
  socket.on("configGame", ({ roomName, id, newConfig }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const admin = room.players.find((p) => p.id === id && p.role === "admin");
    if (!admin) return;

    room.config = newConfig;
    broadcastRoomState(roomName);
  });

  // Expulsar jugador
  socket.on("kickPlayer", ({ roomName, adminId, playerId }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const admin = room.players.find(
      (p) => p.id === adminId && p.role === "admin"
    );
    if (!admin) return;

    const kickedPlayer = room.players.find((p) => p.id === playerId);
    if (!kickedPlayer) return;

    io.sockets.sockets.get(kickedPlayer.socketId)?.leave(roomName);
    io.to(kickedPlayer.socketId).emit("kicked");

    room.players = room.players.filter((p) => p.id !== playerId);

    if (kickedPlayer.role === "admin" && room.players.length > 0) {
      room.players[0].role = "admin";
      io.to(room.players[0].socketId).emit("youAreNowAdmin");
    }

    removeEmptyRooms();

    broadcastRoomState(roomName);
  });

  // Transferir Admin
  socket.on("transferAdmin", ({ roomName, adminId, newAdminId }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const currentAdmin = room.players.find(
      (p) => p.id === adminId && p.role === "admin"
    );
    const newAdmin = room.players.find((p) => p.id === newAdminId);

    if (!currentAdmin || !newAdmin) return;

    currentAdmin.role = "player";
    newAdmin.role = "admin";

    io.to(newAdmin.socketId).emit("youAreNowAdmin");
    broadcastRoomState(roomName);
  });

  socket.on("startGame", async ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const admin = room.players.find((p) => p.id === id && p.role === "admin");
    if (!admin) return;

    room.beingPlayed = true;
    const tempsRestant = room.config.time;

    // 1. Determinar quins jugadors juguen i quins miren
    const playingPlayers = [];
    const spectators = [];

    room.players.forEach(p => {
      // Reset stats per a tothom
      p.points = 0;
      p.errors = 0;
      p.powerUpEarned = false;
      p.correctWordsInARow = 0;
      p.debuff = { type: null, duration: 0 };
      p.mage = null;

      // Assignar rol
      if ((p.id === admin.id) || (p.isReady && p.role !== 'spectator')) {
        p.role = p.id === admin.id ? 'admin' : 'player';
        playingPlayers.push(p);
      } else {
        p.role = 'spectator';
        spectators.push(p);
      }
    });

    const gameDataForSpectators = [];

    // 2. Per a cada jugador, assignar mag i obtenir text
    for (const player of playingPlayers) {
      player.mage = getRandomMage();
      const spellLines = await getRandomSpellText(player.mage.category, 20);

      const spellTextForPlayer = (!spellLines || spellLines.length === 0)
        ? [{ text: "el text no ha carregat correctament.", estat: 'pendent' }]
        : spellLines.map(line => ({ text: line.toLowerCase(), estat: 'pendent' }));

      console.log(`[startGame] Player ${player.name} (${player.id}) assigned mage category: ${player.mage.category}`);
      if (spellTextForPlayer.length > 0) {
        console.log(`[startGame] Player ${player.name} received spell text snippet: "${spellTextForPlayer[0].text.substring(0, 50)}..."`);
      } else {
        console.log(`[startGame] Player ${player.name} received no spell text.`);
      }

      // Enviar l'event individualment a cada jugador
      io.to(player.socketId).emit("gameStarted", {
        time: tempsRestant,
        spellText: spellTextForPlayer,
        category: player.mage.category,
      });
      console.log(`[DEBUG] Sending to player ${player.name} (ID: ${player.id}, SocketID: ${player.socketId}):`);
      console.log(`[DEBUG]   Category: ${player.mage.category}`);
      console.log(`[DEBUG]   Spell Text (first line): ${spellTextForPlayer.length > 0 ? spellTextForPlayer[0].text : 'N/A'}`);

      // Preparar dades per als espectadors
      gameDataForSpectators.push({
        id: player.id,
        name: player.name,
        textEntrat: "",
        indexParaulaActiva: 0,
        paraules: spellTextForPlayer,
      });
    }

    // 3. Actualitzar l'estat de la sala per als espectadors
    room.gameStats = gameDataForSpectators;
    room.spectatorIds = spectators.map(p => p.id);

    spectators.forEach(spectator => {
      io.to(spectator.socketId).emit("gameStarted", { time: tempsRestant, spellText: [] });
      io.to(spectator.socketId).emit("spectatorGameView", room.gameStats);
    });

    // 4. Iniciar el temporitzador del joc
    if (room.timer) clearInterval(room.timer);

    let remainingTime = tempsRestant;
    room.timer = setInterval(() => {
      remainingTime--;
      room.players.forEach((p) => {
        if (p.debuff.duration > 0) {
          p.debuff.duration--;
          if (p.debuff.duration === 0) {
            p.debuff.type = null;
            io.to(p.socketId).emit("debuffEnded");
          }
        }
      });

      if (remainingTime <= 0) {
        endGame(roomName);
      } else {
        io.to(roomName).emit("updateTime", { time: remainingTime });
      }
    }, 1000);

    broadcastRoomState(roomName);
    broadcastRoomList();
  });

  // Puntos y Errores (se mantienen)
  socket.on("addPoints", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player || player.role === "spectator") return;

    if (!player.powerUpEarned) {
      player.correctWordsInARow++;

      if (player.correctWordsInARow === 1) {
        player.powerUpEarned = true;
        io.to(player.socketId).emit("powerUpReady", player.mage);
      }
    }

    player.points++;
    broadcastRanking(roomName);
  });

  socket.on("addErrors", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player || player.role === "spectator") return;

    player.errors++;
    player.correctWordsInARow = 0;

    if (player.debuff.type === "Tsunami") {
      player.debuff.type = null;
      player.debuff.duration = 0;

      // Avisa al client que ha de resetejar el seu progrés
      io.to(player.socketId).emit("tsunamiHit");
      io.to(player.socketId).emit("debuffEnded");
    }

    broadcastRanking(roomName);
  });

  //Us de powerUps
  socket.on("usePowerUp", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const attacker = room.players.find((p) => p.id === id);
    if (!attacker || !attacker.mage) return;

    // Trobar objectius (tots menys l'atacant i espectadors)
    const targets = room.players.filter(
      (p) => p.id !== id && p.role !== "spectator" && p.debuff.type === null // No atacar a algú que ja està sota un efecte
    );

    if (targets.length === 0) {
      // Si no hi ha objectius, notificar a l'atacant i no fer res més
      return io.to(attacker.socketId).emit("powerUpFailed", {
        message: "No s'ha trobat un objectiu vàlid.",
      });
    }

    const target = targets[Math.floor(Math.random() * targets.length)];
    const powerUpType = attacker.mage.powerUp;
    const durationInSeconds = 10;

    target.debuff = { type: powerUpType, duration: durationInSeconds };

    io.to(target.socketId).emit("debuffReceived", {
      type: powerUpType,
      duration: durationInSeconds * 1000,
    });

    // Avisar a l'atacant que el seu power-up s'ha utilitzat correctament
    io.to(attacker.socketId).emit("powerUpUsed");
  });

  // data  conté: {id: 0, textEntrat: '', indexParaulaActiva: 0, paraules: []}
  socket.on("playerGameStatus", ({ roomName, data }) => {
    const room = findRoom(roomName);
    if (!room || !room.beingPlayed) return;

    const playerStat = room.gameStats.find((p) => p.id === data.id);
    if (playerStat) {
      playerStat.textEntrat = data.textEntrat;
      playerStat.indexParaulaActiva = data.indexParaulaActiva;
      playerStat.paraules = data.paraules;

      // 🔑 CORRECCIÓN: Enviar actualización a los espectadores en tiempo real
      // Cada vez que un jugador actualiza su estado, lo enviamos a los espectadores.
      const updatedGameStats = room.gameStats;
      room.spectatorIds.forEach(spectatorId => {
        io.to(room.players.find(p => p.id === spectatorId)?.socketId).emit("spectatorGameView", updatedGameStats);
      });
    } else {
      return;
    }
    // La actualización para el espectador se maneja ahora en el setInterval de startGame
  });

  socket.on("disconnect", () => {
    rooms.forEach((room) => {
      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      room.spectatorIds = room.spectatorIds.filter((id) => id !== player.id);
      room.gameStats = room.gameStats.filter((p) => p.id !== player.id);

      room.players = room.players.filter((p) => p.socketId !== socket.id);

      if (player.role === "admin") {
        assignNewAdmin(room); // ⭐️ Usa la nueva función
      }

      removeEmptyRooms();
      broadcastRoomState(room.name);
      broadcastRoomList();
    });
    console.log("Player disconnected");
  });

  // Jugar de nuevo (se mantienen)
  socket.on("playAgain", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player) return;

    player.isReady = true;
    player.points = 0;
    player.errors = 0;

    broadcastRoomState(roomName);
  });

  //socket que escolta quan un jgador es marxa al acabar la partida
  socket.on("leaveRoom", ({ roomName, id }) => {
    const room = findRoom(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === id);
    if (!player) return;

    // Sacamos al jugador
    room.players = room.players.filter((p) => p.id !== id);
    socket.leave(roomName);

    console.log(`${player.name} ha salido de la sala ${roomName}`);

    // Si era admin, pasar rol al siguiente jugador
    if (player.role === "admin") {
      assignNewAdmin(room);
    }

    // Refrescar estat
    removeEmptyRooms();
    broadcastRoomList();
    broadcastRoomState(roomName);
  });
});

server.listen(port, () => console.log(`Server listening on port ${port}`));