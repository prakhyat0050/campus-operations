import { createFileRoute } from '@tanstack/react-router';
import { Overview } from '@/components/campus/overview';
export const Route = createFileRoute('/')({
 head: () => ({meta:[{title:'Almighty AI — Campus Overview'},{name:'description',content:'Explore your campus intelligence command center: maintenance, sustainability, building status and explainable insights.'},{property:'og:title',content:'Almighty AI — Campus Overview'},{property:'og:description',content:'Smarter Campus. Greener Tomorrow. An interactive campus intelligence demo.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
 component: Overview,
});
