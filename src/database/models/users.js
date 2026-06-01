const { Schema } = require("mongoose");

const userSchema = new Schema({
  user_id: { type: Number, required: true, unique: true },
  username: { type: String, required: false },
  firstname: { type: String, required: true },
  lastname: { type: String, required: false },
  is_dev: { type: Boolean, required: true, default: false },
  is_ban: { type: Boolean, required: true, default: false },
  fowr_private: { type: Boolean, required: true, default: true },
  diariavers: { type: Boolean, required: true, default: false },
  versId: { type: Number, required: false },
  blb365: { type: Boolean, required: true, default: false },
  versiculoUser: { type: Number, required: false, min: 0, max: 32000 },
  dia: { type: Number, required: false, min: 1, max: 366 },
  message: { type: [String], required: false },
  messagePosition: { type: Number, required: false, min: 0, max: 25 },
  messageId: { type: Number, required: false },
  motivosdeoracao: { type: [String], required: false, maxlength: 5 },
  blocodenotas: { type: [String], required: false, maxlength: 10 },
  horariodeoracao: { type: String, required: false },
  diasdeestudo: { type: Number, required: true, min: 0, max: 1000000 },
  receivedPlusOne: { type: Boolean, required: true, default: false },
  last_interaction: { type: String, required: false },
  lastActive: { type: Date, required: false },
  dataCadastro: { type: Date, default: Date.now },
  tipsDiaEnviado: { type: [Number], default: [] },
  referral: { type: String, required: false },
  commandCount: { type: Number, default: 0 },
  translation: { type: String, required: true, enum: ["aa", "acf", "ara", "arc", "as21", "jfaa", "kja", "kjf", "naa", "nbv", "ntlh", "nvi", "nvt", "tb"], default: "acf" }
});

module.exports = userSchema;
