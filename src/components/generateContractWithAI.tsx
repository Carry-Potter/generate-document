import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY
});

export async function generateContractWithAI(contractData: any) {
  const prompt = `Kreiraj profesionalni ${contractData.contractType} ugovor na ${contractData.language === 'sr' ? 'srpskom' : 'engleskom'} jeziku sa sledećim informacijama:

Freelancer: ${contractData.freelancer.name}
- Adresa: ${contractData.freelancer.address}
- Email: ${contractData.freelancer.email}
- Telefon: ${contractData.freelancer.phone}
${contractData.freelancer.pib ? `- PIB: ${contractData.freelancer.pib}` : ''}

Klijent: ${contractData.client.name}
- Adresa: ${contractData.client.address}
- Email: ${contractData.client.email}
- Telefon: ${contractData.client.phone}

Projekat: ${contractData.project.name}
- Opis: ${contractData.project.description}
- Period: ${contractData.project.startDate} - ${contractData.project.endDate}

Plaćanje:
- Iznos: ${contractData.payment.amount} ${contractData.payment.currency}
- Način plaćanja: ${contractData.payment.method}
- Tip plaćanja: ${contractData.payment.type}
${contractData.payment.milestoneDetails ? `- Detalji o fazama: ${contractData.payment.milestoneDetails}` : ''}

Intelektualna svojina: ${contractData.intellectualProperty}
${contractData.confidentiality ? 'Uključiti klauzulu o poverljivosti.' : ''}

Dodatni uslovi:
${contractData.additionalTerms.specialDeadlines ? `- Posebni rokovi: ${contractData.additionalTerms.specialDeadlines}` : ''}
${contractData.additionalTerms.clientObligations ? `- Obaveze klijenta: ${contractData.additionalTerms.clientObligations}` : ''}
${contractData.additionalTerms.terminationConditions ? `- Uslovi raskida: ${contractData.additionalTerms.terminationConditions}` : ''}
${contractData.additionalTerms.warrantyPeriod ? `- Garantni rok: ${contractData.additionalTerms.warrantyPeriod}` : ''}
${contractData.additionalTerms.otherTerms ? `- Ostalo: ${contractData.additionalTerms.otherTerms}` : ''}

Kreiraj pravno validan ugovor koji uključuje sve standardne klauzule i gore navedene specifične uslove.`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4",
    temperature: 0.7,
  });

  return completion.choices[0].message.content || '';
}
