import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { DataService } from '../../core/services/data.service';
import { PalmTrait } from '../../core/models/palm-trait.model';
import { PalmCardComponent } from '../../shared/components/palm-card/palm-card.component';

interface FullGlossaryTerm {
  slug: string;
  term: string;
  definition: string;
  details: string;
  category: string;
  relatedTerms: string[];
  relatedCharacteristic?: { type: string; value: string };
}

@Component({
  selector: 'app-glossary-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PalmCardComponent],
  templateUrl: './glossary-detail.component.html',
  styleUrls: ['./glossary-detail.component.scss'],
})
export class GlossaryDetailComponent implements OnInit {
  term: FullGlossaryTerm | null = null;
  notFound = false;
  exampleSpecies: PalmTrait[] = [];

  private readonly terms: FullGlossaryTerm[] = [
    {
      slug: 'acaulescent', term: 'Acaulescent', category: 'Morphology',
      definition: 'A palm that lacks a visible above-ground stem or trunk.',
      details: 'Acaulescent palms appear stemless, with their leaves emerging directly from ground level or from a very short, subterranean stem. This growth form is an adaptation to understory habitats, where staying low helps avoid wind damage and herbivory. Many popular garden and indoor palms are acaulescent, including species of Chamaedorea, Rhapis, and some Licuala. Despite having no visible trunk, these palms still possess the internal vascular structure typical of monocotyledons.',
      relatedTerms: ['erect', 'climbing', 'solitary', 'understorey'],
      relatedCharacteristic: { type: 'stem', value: 'acaulescent' },
    },
    {
      slug: 'erect', term: 'Erect', category: 'Morphology',
      definition: 'Having an upright, self-supporting trunk or stem.',
      details: 'Erect palms are the most recognizable form, with a single or multiple upright trunks that support a crown of leaves. The trunk of an erect palm is actually a modified stem that grows only from the top (the apical meristem), unlike trees which grow in girth. This means a palm trunk is the same diameter throughout its life. Erect palms range from small garden species under 5 meters to towering giants like Ceroxylon quindiuense reaching over 60 meters.',
      relatedTerms: ['acaulescent', 'climbing', 'solitary', 'canopy'],
      relatedCharacteristic: { type: 'stem', value: 'erect' },
    },
    {
      slug: 'climbing', term: 'Climbing', category: 'Morphology',
      definition: 'A palm that uses specialized structures to climb through surrounding vegetation.',
      details: 'Climbing palms, commonly known as rattans, use recurved hooks on their leaf tips (cirri) or modified inflorescences (flagella) to grip onto surrounding trees and climb toward the canopy. The genus Calamus alone contains over 400 species and includes the longest plants on Earth, with stems exceeding 200 meters. Rattans are economically important for furniture, basketry, and construction materials. Most climbing palms are found in tropical Asian forests.',
      relatedTerms: ['erect', 'acaulescent', 'armed', 'rachis'],
      relatedCharacteristic: { type: 'stem', value: 'climbing' },
    },
    {
      slug: 'solitary', term: 'Solitary', category: 'Morphology',
      definition: 'A palm that produces only a single trunk, as opposed to clustering.',
      details: 'Solitary palms grow with a single main stem throughout their life. If the apical meristem (growing tip) is damaged or killed, the palm will die, as it cannot produce new stems from the base. This contrasts with clustering palms, which can regenerate from basal suckers. The coconut palm (Cocos nucifera) is one of the most well-known solitary palms.',
      relatedTerms: ['clustering', 'erect', 'acaulescent'],
      relatedCharacteristic: { type: 'stem', value: 'solitary' },
    },
    {
      slug: 'clustering', term: 'Clustering', category: 'Morphology',
      definition: 'A palm that produces multiple stems from the base, forming a clump.',
      details: 'Clustering (or caespitose) palms produce new stems from basal buds, creating dense clumps of trunks. This growth form provides redundancy — if one stem dies, others continue growing. Popular clustering palms include Areca (betel nut palm), Chamaedorea, and Rhapis. In horticulture, clustering palms are valued for creating dense, tropical screens and hedges.',
      relatedTerms: ['solitary', 'erect'],
    },
    {
      slug: 'armed', term: 'Armed', category: 'Morphology',
      definition: 'Having spines, thorns, or prickles on the stem, petiole, or leaves.',
      details: 'Armed palms have evolved sharp defensive structures to protect against herbivores. These can appear on the trunk (as in Aiphanes), the petiole (as in Phoenix), or the leaf edges. Some species like Astrocaryum and Bactris are heavily armed with long, needle-like spines. Interestingly, the presence of armature often correlates with the palm\'s native habitat and the types of herbivores present.',
      relatedTerms: ['climbing', 'petiole'],
      relatedCharacteristic: { type: 'stem', value: 'armed' },
    },
    {
      slug: 'canopy', term: 'Canopy', category: 'Morphology',
      definition: 'The uppermost layer of a forest where palm crowns receive direct sunlight.',
      details: 'Canopy palms are tall species that reach the upper levels of tropical forests to compete for direct sunlight. These palms typically have tall, slender trunks and large leaf crowns. They play crucial ecological roles as food sources for birds and mammals, and their fallen fruits support forest floor communities. Many commercially important palms are canopy species, including coconut and oil palms.',
      relatedTerms: ['understorey', 'erect'],
      relatedCharacteristic: { type: 'habitat', value: 'canopy' },
    },
    {
      slug: 'understorey', term: 'Understorey', category: 'Morphology',
      definition: 'The lower layer beneath the forest canopy where shade-tolerant palms grow.',
      details: 'Understorey palms are adapted to low-light conditions beneath the forest canopy. They tend to be smaller, often acaulescent or short-stemmed, with large, dark green leaves optimized for capturing diffuse light. Many popular indoor palms come from understorey habitats, making them naturally suited to the lower light levels found in homes and offices.',
      relatedTerms: ['canopy', 'acaulescent'],
      relatedCharacteristic: { type: 'habitat', value: 'understorey' },
    },
    {
      slug: 'pinnate', term: 'Pinnate', category: 'Leaves',
      definition: 'A feather-shaped leaf with leaflets arranged along a central rachis.',
      details: 'Pinnate leaves are the most common leaf type in palms, found in major genera like Cocos, Phoenix, Areca, and Chamaedorea. The leaflets (pinnae) are arranged along the central rachis like the barbs of a feather. Pinnate leaves can range from less than a meter to over 25 meters in length (as in Raphia palms, which have the longest leaves of any plant). The arrangement of pinnae along the rachis can be regular (in one plane) or irregular (in multiple planes, giving a plumose appearance).',
      relatedTerms: ['palmate', 'bipinnate', 'rachis', 'costapalmate'],
    },
    {
      slug: 'palmate', term: 'Palmate', category: 'Leaves',
      definition: 'A fan-shaped leaf with segments radiating from a central point at the petiole tip.',
      details: 'Palmate (fan) leaves have segments that spread out from the top of the petiole like the fingers of a hand. This leaf type is found in many iconic palms including Washingtonia, Livistona, Licuala, and Bismarckia. Some palmate palms have nearly circular, undivided leaves (like Licuala grandis), while others are deeply divided into narrow segments. The word "palm" itself derives from the Latin "palma" meaning the flat of the hand, reflecting this leaf shape.',
      relatedTerms: ['pinnate', 'costapalmate', 'hastula', 'petiole'],
    },
    {
      slug: 'bipinnate', term: 'Bipinnate', category: 'Leaves',
      definition: 'A doubly-divided compound leaf, found exclusively in the genus Caryota.',
      details: 'Bipinnate leaves are the rarest leaf type among palms, occurring only in the genus Caryota (fishtail palms). In this unique arrangement, the primary leaflets (pinnae) are themselves divided into secondary leaflets, giving a distinctive triangular, fishtail-like appearance. Caryota is also notable for being hapaxanthic — flowering from top to bottom of the trunk before dying. There are about 12-13 species of Caryota across tropical Asia and Australasia.',
      relatedTerms: ['pinnate', 'palmate', 'hapaxanthic'],
    },
    {
      slug: 'costapalmate', term: 'Costapalmate', category: 'Leaves',
      definition: 'An intermediate leaf type between pinnate and palmate, with a short midrib extending into the blade.',
      details: 'Costapalmate leaves are essentially palmate (fan-shaped) but with an extension of the petiole (called the costa) projecting into the leaf blade, causing it to curve slightly. This type is seen in genera like Sabal, Copernicia, and some Livistona species. The costa gives the leaf a slightly more three-dimensional form compared to truly palmate leaves. Costapalmate leaves are sometimes described as "half-way between a feather and a fan."',
      relatedTerms: ['palmate', 'pinnate', 'petiole', 'hastula'],
    },
    {
      slug: 'rachis', term: 'Rachis', category: 'Leaves',
      definition: 'The main axis of a compound leaf, extending from the petiole, to which leaflets are attached.',
      details: 'In pinnate palm leaves, the rachis is the central rib from which the leaflets (pinnae) branch out on either side. It is essentially the extension of the petiole beyond the first pair of leaflets. The rachis length varies enormously — from under a meter in small palms to over 20 meters in Raphia species. In climbing palms, the rachis may extend beyond the last leaflets as a whip-like tendril (cirrus) used for climbing.',
      relatedTerms: ['pinnate', 'petiole', 'climbing'],
    },
    {
      slug: 'petiole', term: 'Petiole', category: 'Leaves',
      definition: 'The stalk connecting the leaf blade to the stem of the palm.',
      details: 'The petiole is the "handle" of the palm leaf, connecting the stem to the leaf blade or rachis. In some palms, the petiole is smooth, while in others it may be armed with sharp spines (as in Phoenix and Zombia). The petiole length affects the overall spread of the leaf crown and the light-capturing ability of the palm. In some species, old petiole bases remain attached to the trunk, creating a distinctive fibrous or boot-like pattern.',
      relatedTerms: ['rachis', 'pinnate', 'palmate', 'armed'],
    },
    {
      slug: 'hastula', term: 'Hastula', category: 'Leaves',
      definition: 'A small, tongue-shaped flap of tissue at the junction of the petiole and blade in palmate leaves.',
      details: 'The hastula is a distinctive feature found at the point where the petiole meets the leaf blade in palmate (fan-leaved) palms. It appears as a small triangular or tongue-shaped projection and is present on the upper surface (adaxial hastula), sometimes also on the lower surface (abaxial hastula). The presence, size, and shape of the hastula are important diagnostic features for identifying palm species, particularly in genera like Licuala, Livistona, and Trachycarpus.',
      relatedTerms: ['palmate', 'petiole', 'costapalmate'],
    },
    {
      slug: 'crownshaft', term: 'Crownshaft', category: 'Leaves',
      definition: 'A smooth, often brightly colored cylindrical column formed by tightly wrapped leaf sheaths at the top of the trunk.',
      details: 'The crownshaft is formed by the overlapping tubular bases of the youngest leaves, creating a smooth, often green or colored column below the leaf crown. It is a distinctive feature of many genera in the subfamily Arecoideae, including Roystonea (royal palms), Archontophoenix, Ptychosperma, and Veitchia. The crownshaft protects the apical meristem and developing leaves. Its color can be bright green, purple, or even orange, adding ornamental value.',
      relatedTerms: ['erect', 'pinnate'],
    },
    {
      slug: 'drupe', term: 'Drupe', category: 'Fruit',
      definition: 'A fleshy fruit with a hard inner stone containing the seed; the most common palm fruit type.',
      details: 'Most palm fruits are drupes, consisting of three layers: the outer skin (exocarp), the fleshy middle layer (mesocarp), and the hard inner stone (endocarp) that encloses the seed. The coconut is a modified drupe with a fibrous mesocarp. Date fruits are also drupes, though their endocarp is thin and papery. Palm drupes vary enormously in size, from tiny berries a few millimeters across (Chamaedorea) to the massive double coconut (Lodoicea) weighing up to 25 kg.',
      relatedTerms: ['endocarp', 'mesocarp', 'globose', 'ovoid'],
    },
    {
      slug: 'globose', term: 'Globose', category: 'Fruit',
      definition: 'Spherical or nearly round in shape.',
      details: 'Globose is one of the most common fruit shapes in palms, describing fruits that are approximately spherical. The coconut (before dehusking) is roughly globose, as are the fruits of many Licuala, Livistona, and Borassus species. Globose fruits often develop bright colors when ripe (red, orange, black) to attract dispersal agents like birds and bats.',
      relatedTerms: ['ovoid', 'ellipsoid', 'drupe'],
      relatedCharacteristic: { type: 'fruit-shape', value: 'globose' },
    },
    {
      slug: 'ovoid', term: 'Ovoid', category: 'Fruit',
      definition: 'Egg-shaped, wider at the base and tapering toward the tip.',
      details: 'Ovoid is the most common fruit shape among palms, found in over 800 species. This shape is efficient for packing seeds and mesocarp, and is seen in major palm genera including Areca, Pinanga, and many Dypsis species. Ovoid fruits often have a smooth, rounded base with a slight point at the apex.',
      relatedTerms: ['globose', 'ellipsoid', 'drupe'],
      relatedCharacteristic: { type: 'fruit-shape', value: 'ovoid' },
    },
    {
      slug: 'ellipsoid', term: 'Ellipsoid', category: 'Fruit',
      definition: 'Oval in shape, symmetrical along the long axis, equally rounded at both ends.',
      details: 'Ellipsoid fruits are elongated and symmetrical, resembling an elongated sphere. This shape is less common than globose or ovoid in palms but is found in several genera including some Chamaedorea and Geonoma species. Ellipsoid fruits are well-suited for dispersal by animals that swallow them whole.',
      relatedTerms: ['globose', 'ovoid', 'drupe'],
      relatedCharacteristic: { type: 'fruit-shape', value: 'ellipsoid' },
    },
    {
      slug: 'endocarp', term: 'Endocarp', category: 'Fruit',
      definition: 'The innermost layer of the fruit wall (pericarp) that directly surrounds and protects the seed.',
      details: 'In palm drupes, the endocarp is typically hard and stony, forming the "pit" or "stone" of the fruit. The coconut shell is the endocarp of the coconut fruit. The endocarp\'s thickness, texture, and the number and position of germination pores are important taxonomic characters used to distinguish between palm species and genera.',
      relatedTerms: ['mesocarp', 'drupe'],
    },
    {
      slug: 'mesocarp', term: 'Mesocarp', category: 'Fruit',
      definition: 'The middle fleshy layer of the fruit, between the skin and the stone.',
      details: 'The mesocarp is the edible fleshy part of many palm fruits. In dates (Phoenix dactylifera), the mesocarp is the sweet, chewy part that is eaten. In oil palms (Elaeis guineensis), the mesocarp is rich in oil — palm oil comes from this layer. In coconuts, the mesocarp becomes fibrous (coir). The mesocarp often changes color as it ripens, signaling to animal dispersers that the fruit is ready to eat.',
      relatedTerms: ['endocarp', 'drupe'],
    },
    {
      slug: 'arecaceae', term: 'Arecaceae', category: 'Taxonomy',
      definition: 'The botanical family name for all palm trees, also historically known as Palmae.',
      details: 'Arecaceae (or Palmae, an older but equally valid name) is the family of flowering plants that includes all palms. It contains approximately 2,600 species in about 185 genera. Palms are monocotyledons, more closely related to grasses and orchids than to "trees" in the traditional sense. The family is divided into 5 subfamilies: Arecoideae, Calamoideae, Coryphoideae, Ceroxyloideae, and Nypoideae. Palms are found on every continent except Antarctica.',
      relatedTerms: ['monocot', 'genus', 'subfamily', 'tribe'],
    },
    {
      slug: 'monocot', term: 'Monocot', category: 'Taxonomy',
      definition: 'Short for monocotyledon: a flowering plant with a single seed leaf, parallel leaf veins, and scattered vascular bundles.',
      details: 'Palms are monocotyledons (monocots), meaning they germinate with a single seed leaf (cotyledon). This places them in the same group as grasses, orchids, lilies, and bananas. Being monocots, palms cannot grow in girth like dicotyledonous trees — their trunks reach full diameter before elongating. This is why palm trunks are typically uniform in width. The vascular bundles in a palm trunk are scattered rather than arranged in a ring, which gives palm wood its characteristic fibrous quality.',
      relatedTerms: ['arecaceae'],
    },
    {
      slug: 'genus', term: 'Genus', category: 'Taxonomy',
      definition: 'A taxonomic rank grouping closely related species that share common characteristics.',
      details: 'In palm taxonomy, the genus (plural: genera) is the most commonly used rank for grouping related species. There are approximately 185 recognized palm genera. Some large genera include Calamus (400+ species), Chamaedorea (100+ species), and Dypsis (160+ species), while some genera contain only a single species (monotypic), such as Cocos (the coconut). Genus names are always italicized and capitalized (e.g., Phoenix, Areca, Roystonea).',
      relatedTerms: ['tribe', 'subfamily', 'arecaceae', 'endemic'],
    },
    {
      slug: 'tribe', term: 'Tribe', category: 'Taxonomy',
      definition: 'A taxonomic rank between subfamily and genus, grouping related genera.',
      details: 'Tribes are intermediate taxonomic groupings used to organize the roughly 185 palm genera into manageable clusters based on evolutionary relationships. The palm family contains 29 tribes. Some notable tribes include Cocoseae (containing coconut, oil palm, and many South American palms), Areceae (the largest tribe with nearly 700 species), and Calameae (the rattan palms). Tribe names always end in "-eae" (e.g., Cocoseae, Areceae).',
      relatedTerms: ['genus', 'subfamily', 'arecaceae'],
    },
    {
      slug: 'subfamily', term: 'Subfamily', category: 'Taxonomy',
      definition: 'A taxonomic rank between family and tribe, the highest subdivision within Arecaceae.',
      details: 'The palm family is divided into five subfamilies: Arecoideae (the largest, with about 1,375 species), Calamoideae (rattans and allies, ~631 species), Coryphoideae (fan palms and allies, ~504 species), Ceroxyloideae (wax palms, ~46 species), and Nypoideae (containing only the mangrove palm Nypa fruticans). These subfamilies represent the deepest evolutionary splits within the palm family.',
      relatedTerms: ['tribe', 'genus', 'arecaceae'],
    },
    {
      slug: 'endemic', term: 'Endemic', category: 'Taxonomy',
      definition: 'A species that is native to and found only in a particular geographic region.',
      details: 'Many palm species are endemic to specific islands or regions, meaning they are found nowhere else naturally. Madagascar is a hotspot for palm endemism, with most of its 200+ palm species found nowhere else. Similarly, many Caribbean islands have endemic palm species. Endemism makes these species particularly vulnerable to habitat loss, as their entire global population exists in one area. Understanding palm endemism is crucial for conservation priorities.',
      relatedTerms: ['arecaceae'],
    },
    {
      slug: 'monoecious', term: 'Monoecious', category: 'Reproduction',
      definition: 'Having both male and female flowers on the same individual plant.',
      details: 'Most palms are monoecious, producing both male (staminate) and female (pistillate) flowers on the same plant, though usually at different times or positions on the inflorescence to promote cross-pollination. In monoecious palms, male flowers typically open before female flowers (protandry) or vice versa (protogyny). The coconut palm is monoecious, with both male and female flowers on the same inflorescence.',
      relatedTerms: ['dioecious', 'inflorescence'],
    },
    {
      slug: 'dioecious', term: 'Dioecious', category: 'Reproduction',
      definition: 'Having male and female flowers on separate individual plants.',
      details: 'In dioecious palms, each plant is either male or female, requiring both sexes for fruit production. Notable dioecious genera include Phoenix (date palms), Chamaedorea, and Borassus. This reproductive strategy ensures cross-pollination but means that only female plants produce fruit. In date palm cultivation, a single male tree can pollinate dozens of females, so growers maintain mostly female plantations with just a few males.',
      relatedTerms: ['monoecious', 'inflorescence'],
    },
    {
      slug: 'inflorescence', term: 'Inflorescence', category: 'Reproduction',
      definition: 'The complete flowering structure of a palm, including the stalk and all branches bearing flowers.',
      details: 'Palm inflorescences are highly variable, from simple spikes to massive, branched structures weighing several kilograms. They typically emerge from the leaf axils (interfoliar) or below the crown (infrafoliar). The inflorescence is initially enclosed in one or more protective bracts called spathes. Some palm inflorescences are among the largest in the plant kingdom — the talipot palm (Corypha umbraculifera) produces an inflorescence up to 8 meters long with millions of flowers.',
      relatedTerms: ['spadix', 'spathe', 'monoecious', 'dioecious'],
    },
    {
      slug: 'spadix', term: 'Spadix', category: 'Reproduction',
      definition: 'A spike-like flowering structure with flowers embedded in a thick, fleshy axis.',
      details: 'The spadix is the central axis of the palm inflorescence on which flowers are borne. In palms, the spadix is typically branched (technically making it a panicle or compound spadix). Flowers are usually small and packed densely along the branches. The spadix is initially protected by one or more large bracts (spathes) that split open as the flowers mature.',
      relatedTerms: ['spathe', 'inflorescence'],
    },
    {
      slug: 'spathe', term: 'Spathe', category: 'Reproduction',
      definition: 'A large, often woody bract that encloses and protects the developing inflorescence.',
      details: 'Spathes are modified leaves that wrap around the developing flower clusters in palms. As the inflorescence matures, the spathe splits open to expose the flowers. Some palms have a single spathe, while others have multiple overlapping spathes. Spathes can be fibrous, papery, or woody. In some species, like the coconut, the spathe is boat-shaped and quite large. The spathe protects developing flowers from rain, herbivores, and premature pollination.',
      relatedTerms: ['spadix', 'inflorescence'],
    },
    {
      slug: 'hapaxanthic', term: 'Hapaxanthic', category: 'Reproduction',
      definition: 'Flowering only once in the life of the palm, then dying after fruiting.',
      details: 'Hapaxanthic (monocarpic) palms invest all their resources into a single, massive flowering event before dying. This strategy is found in notable palms like Caryota (fishtail palms), Corypha (talipot palm), and Metroxylon (sago palm). The talipot palm may grow for 30-80 years before producing its enormous terminal inflorescence of millions of flowers. Hapaxanthic palms that are solitary die completely, while clustering hapaxanthic species only lose the individual stem that flowered.',
      relatedTerms: ['pleonanthic', 'inflorescence'],
    },
    {
      slug: 'pleonanthic', term: 'Pleonanthic', category: 'Reproduction',
      definition: 'Flowering multiple times throughout the life of the palm.',
      details: 'Most palms are pleonanthic, producing flowers and fruits repeatedly over many years or decades. Each inflorescence develops from a leaf axil, and as new leaves grow, new inflorescences can form. This allows pleonanthic palms like the coconut to produce fruits nearly continuously throughout their productive life. The coconut palm, for example, can produce fruit for 60-80 years.',
      relatedTerms: ['hapaxanthic', 'inflorescence'],
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private seoService: SeoService,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('term') || '';
      this.term = this.terms.find(t => t.slug === slug) || null;
      this.notFound = !this.term;

      if (this.term) {
        this.updateSeo();
        this.loadExamples();
      }
    });
  }

  private updateSeo(): void {
    if (!this.term) return;
    this.seoService.update({
      title: `${this.term.term} - Palm Glossary Definition`,
      description: this.term.definition + ' ' + this.term.details.substring(0, 120) + '...',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        name: this.term.term,
        description: this.term.definition,
        url: `https://palma-encyclopedia.com/glossary/${this.term.slug}`,
        inDefinedTermSet: {
          '@type': 'DefinedTermSet',
          name: 'Palm Botany Glossary',
          url: 'https://palma-encyclopedia.com/glossary',
        },
      },
    });
  }

  private loadExamples(): void {
    if (!this.term?.relatedCharacteristic) return;
    const { type, value } = this.term.relatedCharacteristic;
    let obs;
    switch (type) {
      case 'stem': obs = this.dataService.getPalmsByStemType(value); break;
      case 'fruit-shape': obs = this.dataService.getPalmsByFruitShape(value); break;
      case 'habitat': obs = this.dataService.getPalmsByHabitat(value); break;
      default: return;
    }
    obs.subscribe(palms => {
      this.exampleSpecies = palms.slice(0, 6);
    });
  }

  getRelatedTerms(): FullGlossaryTerm[] {
    if (!this.term) return [];
    return this.terms.filter(t => this.term!.relatedTerms.includes(t.slug));
  }
}
