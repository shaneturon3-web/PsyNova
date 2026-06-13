/** Blocs légaux brouillon — maquette, non avis juridique. */

export function legalPageHtml(lang) {
  const blocks = {
    fr: `
      <section class="legal-section"><h2>Consentement éclairé (information)</h2>
      <p>Version maquette : en production, un consentement révisé par les instances compétentes et adapté à chaque modalité de service serait requis avant toute intervention.</p></section>
      <section class="legal-section"><h2>Confidentialité et Loi 25</h2>
      <p>Ce site ne collecte des données réelles que dans la mesure où vous utilisez l’API de démonstration avec des comptes fictifs. Aucune finalité clinique réelle.</p></section>
      <section class="legal-section"><h2>Télépsychologie</h2>
      <p>Les services à distance ont des limites (confidentialité du lieu, urgence, technologie). Ce prototype illustre des parcours sans les remplacer.</p></section>
      <section class="legal-section"><h2>Nature du site (maquette)</h2>
      <p>Cette interface ne constitue pas un service de santé mentale, ne fournit pas de conseils thérapeutiques ni de diagnostic, et ne crée aucune relation professionnelle. Aucune certification réglementaire n’est revendiquée par ce prototype.</p></section>
      <section class="legal-section"><h2>Urgences</h2>
      <p>En cas de danger immédiat : <strong>911</strong>. Ligne de prévention du suicide : <strong>988</strong> (Canada).</p></section>
      <section class="legal-section"><h2>Aucune garantie de résultat</h2>
      <p>La psychothérapie dépend de nombreux facteurs ; aucune amélioration n’est garantie. Texte à valider par des pairs et conseillers.</p></section>`,
    en: `
      <section class="legal-section"><h2>Informed consent (informational)</h2>
      <p>Mockup version: production would require counsel-reviewed consent for each service modality.</p></section>
      <section class="legal-section"><h2>Privacy & Law 25</h2>
      <p>This demo only processes data you send to the mock API with fictional accounts. No real clinical purpose.</p></section>
      <section class="legal-section"><h2>Telepsychology</h2>
      <p>Remote care has limits (privacy of setting, emergencies, technology). This prototype illustrates flows only.</p></section>
      <section class="legal-section"><h2>Site nature (mockup)</h2>
      <p>This interface is not mental health care, not therapeutic advice or diagnosis, and does not create a professional relationship. This prototype does not claim regulatory certification.</p></section>
      <section class="legal-section"><h2>Emergencies</h2>
      <p>Immediate danger: <strong>911</strong>. Suicide prevention: <strong>988</strong> (Canada).</p></section>
      <section class="legal-section"><h2>No outcome guarantee</h2>
      <p>Therapy outcomes vary; nothing here promises improvement. Requires professional and legal review.</p></section>`,
    es: `
      <section class="legal-section"><h2>Consentimiento informado (informativo)</h2>
      <p>Versión de maqueta: en producción se requeriría revisión legal y clínica.</p></section>
      <section class="legal-section"><h2>Privacidad y Ley 25</h2>
      <p>Esta demo solo procesa lo que envíes a la API ficticia. Sin finalidad clínica real.</p></section>
      <section class="legal-section"><h2>Telepsicología</h2>
      <p>La atención remota tiene límites. Este prototipo es ilustrativo.</p></section>
      <section class="legal-section"><h2>Naturaleza del sitio (maqueta)</h2>
      <p>Esta interfaz no es atención en salud mental, no ofrece consejo terapéutico ni diagnóstico, y no crea relación profesional. La maqueta no afirma certificación regulatoria.</p></section>
      <section class="legal-section"><h2>Urgencias</h2>
      <p>Peligro inmediato: <strong>911</strong>. Prevención del suicidio: <strong>988</strong> (Canadá).</p></section>
      <section class="legal-section"><h2>Sin garantía de resultado</h2>
      <p>Los resultados terapéuticos varían; este texto no promete curación.</p></section>`,
  };
  return blocks[lang] || blocks.fr;
}
