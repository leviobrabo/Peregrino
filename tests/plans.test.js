const identidade = require('../src/plans/identidadecristo.json');
const ansiedade = require('../src/plans/ansiedadefe.json');
const salmos = require('../src/plans/salmos30.json');
const proverbios = require('../src/plans/proverbios30.json');
const devocionais = require('../src/plans/devocionais.json');

function validatePlan(plan, expectedDays, name) {
  describe(`plano: ${name}`, () => {
    test(`tem exatamente ${expectedDays} dias`, () => {
      expect(Object.keys(plan).length).toBe(expectedDays);
    });

    for (let d = 1; d <= expectedDays; d++) {
      test(`dia ${d} tem estrutura válida`, () => {
        const day = plan[d];
        expect(day).toBeDefined();
        expect(day.devocional).toBeInstanceOf(Array);
        expect(day.devocional.length).toBeGreaterThan(0);
        expect(day.devocional[0].titulo).toBeTruthy();
        expect(day.devocional[0].texto).toBeTruthy();
        expect(day.biblia).toBeInstanceOf(Array);
        expect(day.biblia.length).toBeGreaterThan(0);
        expect(day.biblia[0].referencia).toBeTruthy();
        expect(day.biblia[0].texto).toBeTruthy();
      });
    }
  });
}

validatePlan(identidade, 7, 'identidadecristo');
validatePlan(ansiedade, 7, 'ansiedadefe');
validatePlan(salmos, 30, 'salmos30');
validatePlan(proverbios, 30, 'proverbios30');
validatePlan(devocionais, 6, 'devocionais');
