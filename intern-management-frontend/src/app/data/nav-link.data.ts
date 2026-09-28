import { NavLinkSchema } from '@data/schema/nav-link.schema'

// The only two features this app has — the template's portfolio links
// (Home/About/Project/Blog/Uses) went away with their pages.
const navlinkData: NavLinkSchema[] = [
  {
    name: 'Batches',
    path: '/batch',
  },
  {
    name: 'Interns',
    path: '/intern',
  },
];

export default navlinkData
