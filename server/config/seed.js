'use strict';

const User = require('../api/user/user.model');
const Service = require('../api/service/service.model');
const Log = require('../api/player/log.model');
const args = process.argv.slice(2);
const ADMIN_ID = '54b3e04cde6279a8211b42fd';

const isRegen = args.indexOf('-r')>-1 || args.indexOf('--regen')>-1;
const isTest = args.indexOf('-t')>-1 || args.indexOf('--test')>-1;
const isPreserve = args.indexOf('-p')>-1 || args.indexOf('--preserve')>-1;

// console.log('DB checking  regen=%s  test=%s', isRegen, isTest, args);

User.findOne({role:'admin'}, (err, user) => {
  if (!user || isRegen) {
    if (user) user.delete();
    User.create({
      _id: ADMIN_ID,
      provider: 'local',
      role: 'admin',
      name: 'admin',
      email: 'leo.olmi@gmail.com',
      password: process.env.VS_ADMIN_PSWD || 'mpestaha' 
    }, () => {
      console.log('finished creating users');
    });  
  } else {
    console.log('finished checking users');
  }
});

if (!isPreserve) {
  Log.deleteMany({}, () => console.log('log cleared'));
}

if (isRegen || isTest) {
  console.log('creating services...');
  Service.deleteMany({}, () => {
    Service.create({
      owner: ADMIN_ID,
      name: 'ciccio lillo',
      description: '',
      active: true,
      dbo: '',
      path: 'testa',
      calls: [{
        path: 'appalla',
        verb: 'get',
        response: '',
        file: '',
        respType: '',
        rules: [{
          expression: '',
          path: '',
          error: 'Undefined!',
          code:500
        }]
      }, {
        path: 'dilegno',
        verb: 'post',
        response: '',
        file: '',
        respType: '',
        rules: [{
          expression: '',
          path: '',
          error: 'Corrupted!',
          code: 502
        }]
      }]
    }, {
      owner: ADMIN_ID,
      name: "inl-test",
      path: "inl",
      active: true,
      calls: [
        {
          "verb": "get",
          "path": "institutes",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "= return db.institutes;"
        },
        {
          "verb": "get",
          "path": "user",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "= return db.user;"
        },
        {
          "verb": "get",
          "path": "menu",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "[\n{\n\"children\": [\n{\n\"children\": [\n{\n\"children\": [],\n\"label\": \"List\",\n\"function\": \"settlementinstructionlist\"\n},\n{\n\"children\": [],\n\"label\": \"Multiple Operation\",\n\"function\": \"MultipleOperation\"\n}\n],\n\"label\": \"Settlement Instruction\",\n\"function\": \"Menu.TLC.SettlementInstruction\"\n}\n],\n\"label\": \"T2S\",\n\"function\": \"tlc\"\n}\n]\n"
        },
        {
          "verb": "get",
          "path": "client",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "{\n  \"profiles\": {\n  \t\"TEST\": true\n  }\n}"
        },
        {
          "verb": "post",
          "path": "wauth",
          "respType": "object",
          "rules": [
            {
              "path": "",
              "expression": "/^(TAS|admin|user|guest)@/g.test(data.username||'')",
              "error": "unknown user!",
              "code": 401
            }
          ],
          "values": [],
          "response": "{\n  \"access_token\": \"d475a948-b971-4ff7-9de9-5e31bdead615\",\n  \"token_type\": \"bearer\",\n  \"refresh_token\": \"f9e5e474-0e88-41e6-885b-d5062a879156\",\n  \"expires_in\": 300000,\n  \"scope\": \"read\"\n}"
        },
        {
          "verb": "get",
          "path": "information/persons",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "[\n  {\n    \"informationId\": 1,\n    \"personId\": 1,\n    \"nationalId\": \"RSSMRA67R17L049Q\",\n    \"name\": \"Mario\",\n    \"surname\": \"Rossi\",\n    \"position\": \"A position\",\n    \"inListReason\": \"No particular reason\",\n    \"tmsAccess\": \"2018-06-14 00:00:00\",\n    \"tmsTermination\": \"2018-06-14 00:00:00\",\n    \"dateOblInfoSent\": \"2018-06-14 00:00:00\",\n    \"dateOblInfoRead\": \"2018-06-14 00:00:00\"\n  }, {\n    \"informationId\": 1,\n    \"personId\": 2,\n    \"nationalId\": \"RSSMRA67R17L049Q\",\n    \"name\": \"Mario\",\n    \"surname\": \"Rossi\",\n    \"position\": \"A position\",\n    \"inListReason\": \"No particular reason\",\n    \"tmsAccess\": \"2018-06-14 00:00:00\",\n    \"tmsTermination\": \"2018-06-14 00:00:00\",\n    \"dateOblInfoSent\": \"2018-06-14 00:00:00\",\n    \"dateOblInfoRead\": \"2018-06-14 00:00:00\"\n  }, {\n    \"informationId\": 2,\n    \"personId\": 3,\n    \"nationalId\": \"RSSMRA67R17L049Q\",\n    \"name\": \"Mario\",\n    \"surname\": \"Rossi\",\n    \"position\": \"A position\",\n    \"inListReason\": \"No particular reason\",\n    \"tmsAccess\": \"2018-06-14 00:00:00\",\n    \"tmsTermination\": \"2018-06-14 00:00:00\",\n    \"dateOblInfoSent\": \"2018-06-14 00:00:00\",\n    \"dateOblInfoRead\": \"2018-06-14 00:00:00\"\n  }, {\n    \"informationId\": 2,\n    \"personId\": 3,\n    \"nationalId\": \"RSSMRA67R17L049Q\",\n    \"name\": \"Mario\",\n    \"surname\": \"Rossi\",\n    \"position\": \"A position\",\n    \"inListReason\": \"No particular reason\",\n    \"tmsAccess\": \"2018-06-14 00:00:00\",\n    \"tmsTermination\": \"2018-06-14 00:00:00\",\n    \"dateOblInfoSent\": \"2018-06-14 00:00:00\",\n    \"dateOblInfoRead\": \"2018-06-14 00:00:00\"\n  }\n]"
        },
        {
          "verb": "get",
          "path": "information/instruments",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "[\n  {\n    \"id\": 1,\n    \"instrumentCode\": \"IT1234567890\",\n    \"instrumentDesc\": \"FIAT General\",\n    \"instrumentType\": \"Security\"\n  }, {\n    \"id\": 2,\n    \"instrumentCode\": \"IT1236542256\",\n    \"instrumentDesc\": \"FIOCCHI DI NEVE\",\n    \"instrumentType\": \"Security\"\n  }, {\n    \"id\": 3,\n    \"instrumentCode\": \"IT1241246436\",\n    \"instrumentDesc\": \"Zaratustra\",\n    \"instrumentType\": \"Semidio\"\n  }, {\n    \"id\": 4,\n    \"instrumentCode\": \"IT9087999964\",\n    \"instrumentDesc\": \"Zarillo\",\n    \"instrumentType\": \"Security\"\n  }, {\n    \"id\": 5,\n    \"instrumentCode\": \"IT1230000000\",\n    \"instrumentDesc\": \"Mulino Verde\",\n    \"instrumentType\": \"Biscotti\"\n  }\n]"
        },
        {
          "verb": "get",
          "path": "information/list",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "= return db.informations;"
        },
        {
          "verb": "get",
          "path": "information/history",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "[\n  { \n    \"id\": 1, \n    \"issuerCode\": \"23452\", \n    \"issuerDescription\": \"An Institute\", \n    \"issuerAddress\": \"An address\", \n    \"informationDescription\": \"An information description\", \n    \"informationStatus\": \"R\", \n    \"informationType\": \"An informattion Type\", \n    \"tmsInsert\": \"2018-06-14 00:00:00\", \n    \"tmsFirstInsert\": \"2018-06-14 00:00:00\", \n    \"tmsUpdate\": \"2018-06-14 00:00:00\", \n    \"updateReason\": \"No apparent reason\", \n    \"updateUser\": \"USER\", \n    \"dateSentToCA\": \"2018-06-14 00:00:00\", \n    \"publishingDate\": \"2018-06-14 00:00:00\", \n    \"publishingRef\": \"AOH-9584025\", \n    \"tmsTermination\": \"2018-06-14 00:00:00\", \n    \"delayDecisionDate\": \"2018-06-14 00:00:00\", \n    \"delayCommunicationDate\": \"2018-06-14 00:00:00\", \n    \"publishingScheduledDate\": \"2018-06-14 00:00:00\", \n    \"delayCommunicationReason\": \"No real reason\", \n    \"delayConditionsFulfillment\": \"Fulfillment\" \n  }, { \n    \"id\": 1, \n    \"issuerCode\": \"25432\", \n    \"issuerDescription\": \"An Institute\", \n    \"issuerAddress\": \"An address\", \n    \"informationDescription\": \"An information description\", \n    \"informationStatus\": \"R\", \n    \"informationType\": \"An informattion Type\", \n    \"tmsInsert\": \"2018-06-14 00:00:00\", \n    \"tmsFirstInsert\": \"2018-06-14 00:00:00\", \n    \"tmsUpdate\": \"2018-06-14 00:00:00\", \n    \"updateReason\": \"No apparent reason\", \n    \"updateUser\": \"USER\", \n    \"dateSentToCA\": \"2018-06-14 00:00:00\", \n    \"publishingDate\": \"2018-06-14 00:00:00\", \n    \"publishingRef\": \"AOH-9584025\", \n    \"tmsTermination\": \"2018-06-14 00:00:00\", \n    \"delayDecisionDate\": \"2018-06-14 00:00:00\", \n    \"delayCommunicationDate\": \"2018-06-14 00:00:00\", \n    \"publishingScheduledDate\": \"2018-06-14 00:00:00\", \n    \"delayCommunicationReason\": \"No real reason\", \n    \"delayConditionsFulfillment\": \"Fulfillment\" \n  }, { \n    \"id\": 3, \n    \"issuerCode\": \"48555\", \n    \"issuerDescription\": \"An Institute\", \n    \"issuerAddress\": \"An address\", \n    \"informationDescription\": \"An information description\", \n    \"informationStatus\": \"R\", \n    \"informationType\": \"An informattion Type\", \n    \"tmsInsert\": \"2018-06-14 00:00:00\", \n    \"tmsFirstInsert\": \"2018-06-14 00:00:00\", \n    \"tmsUpdate\": \"2018-06-14 00:00:00\", \n    \"updateReason\": \"No apparent reason\", \n    \"updateUser\": \"USER\", \n    \"dateSentToCA\": \"2018-06-14 00:00:00\", \n    \"publishingDate\": \"2018-06-14 00:00:00\", \n    \"publishingRef\": \"AOH-9584025\", \n    \"tmsTermination\": \"2018-06-14 00:00:00\", \n    \"delayDecisionDate\": \"2018-06-14 00:00:00\", \n    \"delayCommunicationDate\": \"2018-06-14 00:00:00\", \n    \"publishingScheduledDate\": \"2018-06-14 00:00:00\", \n    \"delayCommunicationReason\": \"No real reason\", \n    \"delayConditionsFulfillment\": \"Fulfillment\" \n  }\n]"
        },
        {
          "verb": "get",
          "path": "instrument/list",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "= return db.instruments;"
        },
        {
          "verb": "get",
          "path": "person/list",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "= return db.persons;"
        },
        {
          "verb": "get",
          "path": "infodetailpersons",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "[\n  {\n    \"personId\": 1,\n    \"nationalId\": \"RSSMRA67R17L049Q\",\n    \"name\": \"Mario\",\n    \"surname\": \"Rossi\",\n    \"function\": \"function A\"\n  }, {\n    \"personId\": 2,\n    \"nationalId\": \"ASOIDUASOIAOISDU\",\n    \"name\": \"Franco\",\n    \"surname\": \"Rossi\",\n    \"function\": \"function B\"\n  }, {\n    \"personId\": 3,\n    \"nationalId\": \"TPOEWIOPLKSLKFJ\",\n    \"name\": \"Ugo\",\n    \"surname\": \"Gillimo\",\n    \"function\": \"function E\"\n  }, {\n    \"personId\": 4,\n    \"nationalId\": \"RSSMRA67R17L049Q\",\n    \"name\": \"Bobo\",\n    \"surname\": \"Craxi\",\n    \"function\": \"function E\"\n  }\n]"
        },
        {
          "verb": "get",
          "path": "person/history",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "[\n  {\n    \"informationId\": 1,\n    \"personId\": 1,\n    \"nationalId\": \"RSSMRA67R17L049Q\",\n    \"name\": \"Mario\",\n    \"surname\": \"Rossi\",\n    \"position\": \"A position\",\n    \"inListReason\": \"No particular reason\",\n    \"tmsAccess\": \"2018-06-14 00:00:00\",\n    \"tmsTermination\": \"2018-06-14 00:00:00\",\n    \"dateOblInfoSent\": \"2018-06-14 00:00:00\",\n    \"dateOblInfoRead\": \"2018-06-14 00:00:00\"\n  }\n]"
        },
        {
          "verb": "get",
          "path": "filters",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "[{\n  \"id\": 1,\n  \"name\": \"Test Filter 001\",\n  \"items\": [],\n  \"value\": {}\n}]"
        },
        {
          "verb": "get",
          "path": "report/list",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "[{\n  \"id\": 1,\n  \"type\": 1,\n  \"name\": \"Report test n°1\",\n  \"desc\": \"treasdas asdasdf asdf ags agdasfg agasd asdf asdfa sdfas a ds fasdfasdfas asdf asdkfj asdkfasdkfhksjhfakjsdh fak sf asdf akjsdfhasdfk aksjdfasdfk askdjfh askdfh akjsdfhaks.\"\n}, {\n  \"id\": 2,\n  \"type\": 2,\n  \"name\":\"Altro report n°2\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 3,\n  \"type\": 1,\n  \"name\":\"Altro report n°3\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 4,\n  \"type\": 1,\n  \"name\":\"Altro report n°4\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 5,\n  \"name\":\"Altro report n°5\",\n  \"type\": 2,\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 6,\n  \"name\":\"Altro report n°6\",\n  \"type\": 3,\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 7,\n  \"name\":\"Altro report n°7\",\n  \"type\": 4,\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 8,\n  \"type\": 4,\n  \"name\":\"Altro report n°8\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 9,\n  \"type\": 3,\n  \"name\":\"Altro report n°9\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 10,\n  \"type\": 3,\n  \"name\":\"Altro report n°10\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 11,\n  \"type\": 1,\n  \"name\":\"Altro report n°11\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 12,\n  \"type\": 2,\n  \"name\":\"Altro report n°12\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 13,\n  \"type\": 3,\n  \"name\":\"Altro report n°13\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 14,\n  \"type\": 1,\n  \"name\":\"Altro report n°14\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 15,\n  \"type\": 2,\n  \"name\":\"Altro report n°15\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 16,\n  \"type\": 2,\n  \"name\":\"Altro report n°16\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 17,\n  \"type\": 4,\n  \"name\":\"Altro report n°17\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 18,\n  \"type\": 4,\n  \"name\":\"Altro report n°18\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}, {\n  \"id\": 19,\n  \"type\": 4,\n  \"name\":\"Altro report n°19\",\n  \"desc\": \"poasdfaskjfs dfasdj.\"\n}]"
        },
        {
          "verb": "get",
          "path": "report/noaccesspersons",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "[]"
        },
        {
          "verb": "get",
          "path": "report/accesspersons",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "[]"
        },
        {
          "verb": "get",
          "path": "report/publishdelay",
          "respType": "object",
          "rules": [],
          "values": [],
          "response": "[]"
        },
        {
          "verb": "delete",
          "path": "instrument",
          "respType": "object",
          "rules": [
            {
              "path": "",
              "expression": "!!params.id",
              "error": "Undefined identity!",
              "code": 500
            }
          ],
          "values": [],
          "response": "= return _.remove(db.instruments, i => i.id == params.id)",
          "testData": "{\n  id: 4\n}"
        },
        {
          "verb": "delete",
          "path": "information",
          "respType": "object",
          "rules": [
            {
              "path": "",
              "expression": "!!params.id",
              "error": "Undefined identity!",
              "code": 500
            }
          ],
          "values": [],
          "response": "= return _.remove(db.informations, i => i.id == params.id);",
          "testData": "{id:2}"
        }
      ],
      dbo: "{\n  user: {\n    \"allowedFunctionCodes\": [\n      \"dashboard\",\n      \"insiderlist\",\n      \"insiderlist_informations\",\n      \"insiderlist_informations_add\",\n      \"insiderlist_informations_delete\",\n      \"insiderlist_informations_edit\",\n      \"insiderlist_informations_history\",\n      \"insiderlist_instruments\",\n      \"insiderlist_instruments_add\",\n      \"insiderlist_instruments_delete\",\n      \"insiderlist_instruments_edit\",\n      \"insiderlist_instruments_history\",\n      \"insiderlist_persons\",\n      \"insiderlist_persons_add\",\n      \"insiderlist_persons_delete\",\n      \"insiderlist_persons_edit\",\n      \"insiderlist_persons_history\",\n      \"insiderlist_reports\",\n      \"insiderlist_reports_list\",\n      \"insiderlist_reports_templates\",\n      \"reservationjournal\",\n      \"reservationjournal_add\",\n      \"reservationjournal_authorize\",\n      \"reservationjournal_history\",\n      \"reservationjournal_modify\"\n    ],\n    \"forbiddenFunctionCodes\": [],\n    \"instituteCode\": \"03123\",\n    \"instituteDesc\": \"Istituto n2 ciccio ciborio con descrizione lunghissima\",\n    \"instituteId\": 446,\n    \"locale\": null,\n    \"name\": \"TAS\",\n    \"profiles\": [\n      \"USER\"\n    ]\n  },\n  institutes: [\n    {\"key\":1,\"value\":\"Istituto n1\"},\n    {\"key\":2,\"value\":\"Istituto n2\"},\n    {\"key\":3,\"value\":\"Istituto n3\"}\n  ],\n  persons: [\n    {\n      \"kind\": \"personresource\",\n      \"id\": 229,\n      \"activePerson\": \"A\",\n      \"tmsInsert\": \"2018-12-11T16:34:16.892Z\",\n      \"insertType\": \"M\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateType\": null,\n      \"updateUser\": null,\n      \"updateReason\": \"Any reason\",\n      \"version\": 1,\n      \"personType\": \"A\",\n      \"nationalId\": \"ITRZZFLP57T10M180Z\",\n      \"name\": \"PIPPO\",\n      \"surname\": \"RAZZI\",\n      \"birthSurname\": \"RAZZI\",\n      \"birthDate\": \"1957-12-10\",\n      \"birthplace\": \"MILANO (MI)\",\n      \"position\": \"DB ADMINISTRATOR UPDATED\",\n      \"officePhone\": \"06-12345\",\n      \"officeMobile\": null,\n      \"officeEmail\": null,\n      \"companyName\": null,\n      \"companyCountry\": \"ITALY\",\n      \"companyTown\": \"ROMA\",\n      \"companyZip\": \"00100\",\n      \"companyAddress\": null,\n      \"personalPhone\": null,\n      \"personalMobile\": \"333-12345\",\n      \"residenceCountry\": \"ITALY\",\n      \"residenceTown\": \"ROMA\",\n      \"residenceZip\": \"00100\",\n      \"residenceAddress\": \"VIA DEL MELO 1\",\n      \"issuerCode\": \"03123\",\n      \"parentId\": 103\n    },\n    {\n      \"kind\": \"personresource\",\n      \"id\": 208,\n      \"activePerson\": \"A\",\n      \"tmsInsert\": \"2018-12-11T14:40:22.899Z\",\n      \"insertType\": \"M\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateType\": null,\n      \"updateUser\": null,\n      \"updateReason\": \"aggiornato cognome di nascita\",\n      \"version\": 1,\n      \"personType\": \"A\",\n      \"nationalId\": \"ITVRDPLA64A10T160Q\",\n      \"name\": \"PAOLO\",\n      \"surname\": \"VERDI\",\n      \"birthSurname\": \"BLUGIALLO\",\n      \"birthDate\": \"1967-11-17\",\n      \"birthplace\": \"TORINO (TO)\",\n      \"position\": \"PMO\",\n      \"officePhone\": \"06-12345678\",\n      \"officeMobile\": \"333-12345678\",\n      \"officeEmail\": \"paolo.verdi@aziendadue.com\",\n      \"companyName\": \"AZIENDA DUE\",\n      \"companyCountry\": \"ITALIA\",\n      \"companyTown\": \"ROMA (RM)\",\n      \"companyZip\": \"00100\",\n      \"companyAddress\": \"VIA MAZZINI 14\",\n      \"personalPhone\": \"06-987654321\",\n      \"personalMobile\": \"333-987654321\",\n      \"residenceCountry\": \"ITALIA\",\n      \"residenceTown\": \"VITERBO (VT)\",\n      \"residenceZip\": \"00199\",\n      \"residenceAddress\": \"VIA GARIBALDI 1\",\n      \"issuerCode\": \"03123\",\n      \"parentId\": 22\n    },\n    {\n      \"kind\": \"personresource\",\n      \"id\": 203,\n      \"activePerson\": \"A\",\n      \"tmsInsert\": \"2018-12-11T14:12:37.887Z\",\n      \"insertType\": \"M\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateType\": null,\n      \"updateUser\": null,\n      \"updateReason\": \"modificato cognome di famiglia\",\n      \"version\": 1,\n      \"personType\": \"P\",\n      \"nationalId\": \"OIUDAUS987D98A9\",\n      \"name\": \"CAIO\",\n      \"surname\": \"LOLLO\",\n      \"birthSurname\": \"BAROLLO\",\n      \"birthDate\": \"1984-06-02\",\n      \"birthplace\": \"ROMA\",\n      \"position\": \"CAPO\",\n      \"officePhone\": null,\n      \"officeMobile\": \"333666555444\",\n      \"officeEmail\": null,\n      \"companyName\": null,\n      \"companyCountry\": \"ITALIA\",\n      \"companyTown\": \"ROMA\",\n      \"companyZip\": \"78945\",\n      \"companyAddress\": null,\n      \"personalPhone\": \"444555666777\",\n      \"personalMobile\": null,\n      \"residenceCountry\": \"ITALIA\",\n      \"residenceTown\": \"ROMA\",\n      \"residenceZip\": \"45678\",\n      \"residenceAddress\": \"via popopopo 5\",\n      \"issuerCode\": \"03123\",\n      \"parentId\": 143\n    },\n    {\n      \"kind\": \"personresource\",\n      \"id\": 2,\n      \"activePerson\": \"A\",\n      \"tmsInsert\": \"2018-11-01T12:00:00.000Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateType\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"personType\": \"A\",\n      \"nationalId\": \"ITZZZMRA67R47M180Z\",\n      \"name\": \"GIOVANNA\",\n      \"surname\": \"ZAZZERA\",\n      \"birthSurname\": null,\n      \"birthDate\": \"1967-10-17\",\n      \"birthplace\": \"CAVALLINO (LE)\",\n      \"position\": \"SISTEMISTA\",\n      \"officePhone\": \"06-12345678\",\n      \"officeMobile\": \"333-12345678\",\n      \"officeEmail\": \"maria.zazzera@azienda.com\",\n      \"companyName\": \"AZIENDA\",\n      \"companyCountry\": \"ITALIA\",\n      \"companyTown\": \"ROMA (RM)\",\n      \"companyZip\": \"00100\",\n      \"companyAddress\": \"VIA CRISTOFORO COLOMBO 149\",\n      \"personalPhone\": \"06-987654321\",\n      \"personalMobile\": \"333-987654321\",\n      \"residenceCountry\": \"ITALIA\",\n      \"residenceTown\": \"ROMA (RM)\",\n      \"residenceZip\": \"00199\",\n      \"residenceAddress\": \"VIA DEI CASTELLI 1\",\n      \"issuerCode\": \"03123\",\n      \"parentId\": 2\n    },\n    {\n      \"kind\": \"personresource\",\n      \"id\": 1,\n      \"activePerson\": \"A\",\n      \"tmsInsert\": \"2018-11-01T12:00:00.000Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateType\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"personType\": \"P\",\n      \"nationalId\": \"ITRSSMRA67R17M180Q\",\n      \"name\": \"MARIO\",\n      \"surname\": \"ROSSI\",\n      \"birthSurname\": null,\n      \"birthDate\": \"1967-10-17\",\n      \"birthplace\": \"LECCE (LE)\",\n      \"position\": \"DB ADMINISTRATOR\",\n      \"officePhone\": \"06-12345678\",\n      \"officeMobile\": \"333-12345678\",\n      \"officeEmail\": \"mario.rossi@azienda.com\",\n      \"companyName\": \"AZIENDA\",\n      \"companyCountry\": \"ITALIA\",\n      \"companyTown\": \"ROMA (RM)\",\n      \"companyZip\": \"00100\",\n      \"companyAddress\": \"VIA CRISTOFORO COLOMBO 149\",\n      \"personalPhone\": \"06-987654321\",\n      \"personalMobile\": \"333-987654321\",\n      \"residenceCountry\": \"ITALIA\",\n      \"residenceTown\": \"GENZANO (RM)\",\n      \"residenceZip\": \"00199\",\n      \"residenceAddress\": \"VIA DEI FIORI 1\",\n      \"issuerCode\": \"03123\",\n      \"parentId\": 1\n    }\n  ],\n  instruments: [\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 143,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-11T09:58:50.207Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"ittttt\",\n      \"instrumentDesc\": \"azione con diritto di voto\",\n      \"instrumentType\": \"azione\"\n    },\n    {\n"+
           "      \"kind\": \"instrumentresource\",\n      \"id\": 147,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-11T11:14:42.882Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"ggggg\",\n      \"instrumentDesc\": \"ttttttt\",\n      \"instrumentType\": \"fffff\"\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 192,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-11T14:31:42.693Z\",\n      \"insertType\": \"M\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": \"asdfhasdf kasdjhf askd\",\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"PP12341234141\",\n      \"instrumentDesc\": \"fghdfghdhdf oiuoidsf\",\n      \"instrumentType\": null\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 191,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-11T14:29:57.773Z\",\n      \"insertType\": \"M\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": \"gdfgs dfgs fg sdfsg dfsgg OAOO\",\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"PO90273589234\",\n      \"instrumentDesc\": \"dfgdfsgdgfsdf dfsgdfgsdfg\",\n      \"instrumentType\": null\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 188,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-11T14:27:40.635Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"PE2345235234\",\n      \"instrumentDesc\": \"dfsghbdgfshdgfhgfhdfggh\",\n      \"instrumentType\": \"rfgsdfg\"\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 205,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-11T15:31:54.379Z\",\n      \"insertType\": \"M\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": \"asdfasdfasf\",\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"PAasdfasdf\",\n      \"instrumentDesc\": \"dfgdsfgs dfgsdfgsdfgsd\",\n      \"instrumentType\": null\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 184,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-11T13:13:16.076Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"PA345235423\",\n      \"instrumentDesc\": \"asdfadsfadsfadsf\",\n      \"instrumentType\": \"asdfa\"\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 219,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-11T16:31:10.939Z\",\n      \"insertType\": \"M\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": \"Any reason\",\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"IT91234567\",\n      \"instrumentDesc\": \"TEST REST SECURITY MODIFIED\",\n      \"instrumentType\": \"SECURITY\"\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 83,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-10T10:42:17.373Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"IT45234523452\",\n      \"instrumentDesc\": \"GIRELLA\",\n      \"instrumentType\": \"CIBO\"\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 3,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-01-11T12:00:00.000Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"IT3334567890\",\n      \"instrumentDesc\": \"IVECO\",\n      \"instrumentType\": \"SECURITY\"\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 103,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-10T12:37:03.241Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"IT23489572534\",\n      \"instrumentDesc\": \"SALAMINO\",\n      \"instrumentType\": \"CIBO\"\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 1,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-01-11T12:00:00.000Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"IT1234567890\",\n      \"instrumentDesc\": \"FIAT AVIO\",\n      \"instrumentType\": \"SECURITY\"\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 146,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-11T10:32:13.020Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"IT1234\",\n      \"instrumentDesc\": \"strumento errato\",\n      \"instrumentType\": \"non corretto\"\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 145,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-11T10:29:44.880Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"IT1234\",\n      \"instrumentDesc\": \"strumento prova\",\n      \"instrumentType\": \"prova\"\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 24,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-05T12:00:00.000Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"ADMINICCREA\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"IT0004053440\",\n      \"instrumentDesc\": \"DATALOGIC\",\n      \"instrumentType\": \"SECURITY\"\n    },\n    {\n      \"kind\": \"instrumentresource\",\n      \"id\": 23,\n      \"parentId\": null,\n      \"activeInstrument\": \"A\",\n      \"tmsInsert\": \"2018-12-05T12:00:00.000Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"ADMINICCREA\",\n      \"tmsUpdate\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"instrumentId\": null,\n      \"instrumentCode\": \"IT0000062072\",\n      \"instrumentDesc\": \"GENERALI\",\n      \"instrumentType\": \"SECURITY\"\n    }\n  ],\n  informations: [\n    {\n      \"kind\": \"informationresource\",\n      \"id\": 563,\n      \"parentId\": 562,\n      \"activeInformation\": \"A\",\n      \"tmsInsert\": \"2018-12-11T14:10:16.417Z\",\n      \"insertType\": \"M\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateType\": null,\n      \"updateUser\": null,\n      \"updateReason\": \"modifica\",\n      \"version\": 1,\n      \"issuerCode\": \"03123\",\n      \"issuerDescription\": "+
           "\"ICCREA BANCAIMPRESA S.P.A.\",\n      \"informationDesc\": \"Test inserimento 024 modificato\",\n      \"informationStatus\": \"P\",\n      \"informationType\": \"attività dei revisori\",\n      \"terminationDate\": null,\n      \"tmsFirstInsert\": \"2018-12-11T12:49:20.189Z\",\n      \"userFirstInsert\": \"TAS\",\n      \"publishingDate\": null,\n      \"publishingRef\": null,\n      \"dateSentToCa\": null,\n      \"delayDecisionDate\": null,\n      \"delayCommunicationDate\": null,\n      \"delayCommunicationReason\": null,\n      \"delayConditionsFulfill\": null,\n      \"publishingScheduledDate\": null,\n      \"workflowStatus\": null\n    },\n    {\n      \"kind\": \"informationresource\",\n      \"id\": 561,\n      \"parentId\": 561,\n      \"activeInformation\": \"A\",\n      \"tmsInsert\": \"2018-12-11T12:34:09.923Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateType\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"issuerCode\": \"03123\",\n      \"issuerDescription\": \"ICCREA BANCAIMPRESA S.P.A.\",\n      \"informationDesc\": \"fff\",\n      \"informationStatus\": \"P\",\n      \"informationType\": \"ffff\",\n      \"terminationDate\": null,\n      \"tmsFirstInsert\": \"2018-12-11T12:34:09.923Z\",\n      \"userFirstInsert\": \"TAS\",\n      \"publishingDate\": null,\n      \"publishingRef\": null,\n      \"dateSentToCa\": null,\n      \"delayDecisionDate\": null,\n      \"delayCommunicationDate\": null,\n      \"delayCommunicationReason\": null,\n      \"delayConditionsFulfill\": null,\n      \"publishingScheduledDate\": null,\n      \"workflowStatus\": null\n    },\n    {\n      \"kind\": \"informationresource\",\n      \"id\": 501,\n      \"parentId\": 501,\n      \"activeInformation\": \"A\",\n      \"tmsInsert\": \"2018-12-10T15:10:02.905Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateType\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"issuerCode\": \"03123\",\n      \"issuerDescription\": \"ICCREA BANCAIMPRESA S.P.A.\",\n      \"informationDesc\": \"Primo test inserimento main scenario\",\n      \"informationStatus\": \"P\",\n      \"informationType\": \"Sezione Soggetti ad Acesso Permanente\",\n      \"terminationDate\": null,\n      \"tmsFirstInsert\": \"2018-12-10T15:10:02.905Z\",\n      \"userFirstInsert\": \"TAS\",\n      \"publishingDate\": null,\n      \"publishingRef\": null,\n      \"dateSentToCa\": null,\n      \"delayDecisionDate\": null,\n      \"delayCommunicationDate\": null,\n      \"delayCommunicationReason\": null,\n      \"delayConditionsFulfill\": null,\n      \"publishingScheduledDate\": null,\n      \"workflowStatus\": null\n    },\n    {\n      \"kind\": \"informationresource\",\n      \"id\": 463,\n      \"parentId\": 463,\n      \"activeInformation\": \"A\",\n      \"tmsInsert\": \"2018-12-07T19:01:19.041Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateType\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"issuerCode\": \"03123\",\n      \"issuerDescription\": \"ICCREA BANCAIMPRESA S.P.A.\",\n      \"informationDesc\": \"Another information description\",\n      \"informationStatus\": \"P\",\n      \"informationType\": \"Another information type\",\n      \"terminationDate\": null,\n      \"tmsFirstInsert\": \"2018-12-07T19:01:19.041Z\",\n      \"userFirstInsert\": \"TAS\",\n      \"publishingDate\": null,\n      \"publishingRef\": null,\n      \"dateSentToCa\": null,\n      \"delayDecisionDate\": null,\n      \"delayCommunicationDate\": null,\n      \"delayCommunicationReason\": null,\n      \"delayConditionsFulfill\": null,\n      \"publishingScheduledDate\": null,\n      \"workflowStatus\": null\n    },\n    {\n      \"kind\": \"informationresource\",\n      \"id\": 446,\n      \"parentId\": 446,\n      \"activeInformation\": \"A\",\n      \"tmsInsert\": \"2018-12-07T15:51:54.211Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateType\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"issuerCode\": \"03123\",\n      \"issuerDescription\": \"ICCREA BANCAIMPRESA S.P.A.\",\n      \"informationDesc\": \"test inserimento 023\",\n      \"informationStatus\": \"P\",\n      \"informationType\": \"attività dei revisori\",\n      \"terminationDate\": null,\n      \"tmsFirstInsert\": \"2018-12-07T15:51:54.211Z\",\n      \"userFirstInsert\": \"TAS\",\n      \"publishingDate\": \"2018-12-05T23:00:00.000Z\",\n      \"publishingRef\": null,\n      \"dateSentToCa\": null,\n      \"delayDecisionDate\": null,\n      \"delayCommunicationDate\": null,\n      \"delayCommunicationReason\": null,\n      \"delayConditionsFulfill\": null,\n      \"publishingScheduledDate\": null,\n      \"workflowStatus\": null\n    },\n    {\n      \"kind\": \"informationresource\",\n      \"id\": 445,\n      \"parentId\": 445,\n      \"activeInformation\": \"A\",\n      \"tmsInsert\": \"2018-12-07T14:12:44.931Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateType\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"issuerCode\": \"03123\",\n      \"issuerDescription\": \"ICCREA BANCAIMPRESA S.P.A.\",\n      \"informationDesc\": \"BV: Descrizione informazione 1\",\n      \"informationStatus\": \"P\",\n      \"informationType\": \"Sezione Soggetti ad Acesso Permanente\",\n      \"terminationDate\": null,\n      \"tmsFirstInsert\": \"2018-12-07T14:12:44.931Z\",\n      \"userFirstInsert\": \"TAS\",\n      \"publishingDate\": null,\n      \"publishingRef\": null,\n      \"dateSentToCa\": null,\n      \"delayDecisionDate\": null,\n      \"delayCommunicationDate\": null,\n      \"delayCommunicationReason\": null,\n      \"delayConditionsFulfill\": null,\n      \"publishingScheduledDate\": null,\n      \"workflowStatus\": null\n    },\n    {\n      \"kind\": \"informationresource\",\n      \"id\": 423,\n      \"parentId\": 423,\n      \"activeInformation\": \"A\",\n      \"tmsInsert\": \"2018-12-07T09:52:22.062Z\",\n      \"insertType\": \"I\",\n      \"insertUser\": \"TAS\",\n      \"tmsUpdate\": null,\n      \"updateType\": null,\n      \"updateUser\": null,\n      \"updateReason\": null,\n      \"version\": 1,\n      \"issuerCode\": \"03123\",\n      \"issuerDescription\": \"ICCREA BANCAIMPRESA S.P.A.\",\n      \"informationDesc\": \"test date\",\n      \"informationStatus\": \"P\",\n      \"informationType\": \"composizione del management\",\n      \"terminationDate\": null,\n      \"tmsFirstInsert\": \"2018-12-07T09:52:22.062Z\",\n      \"userFirstInsert\": \"TAS\",\n      \"publishingDate\": null,\n      \"publishingRef\": null,\n      \"dateSentToCa\": null,\n      \"delayDecisionDate\": null,\n      \"delayCommunicationDate\": null,\n      \"delayCommunicationReason\": null,\n      \"delayConditionsFulfill\": null,\n      \"publishingScheduledDate\": null,\n      \"workflowStatus\": null\n    }\n  ]\n}"
    }, {
      owner: ADMIN_ID,
      name: 'disabled-service',
      description: 'servizio disabilitato per vedere come si visualizza',
      active: false,
      dbo: '',
      path: '',
      calls: []
    }, () => {
      console.log('finished populating services (test mode)');
    });
  });
}
