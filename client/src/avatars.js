/**
 * Ghibli-style animal avatars available for players to choose from.
 * Each entry: { id, src, label }
 */
export const AVATARS = [
  { id: 'fox',      src: '/avatars/avatar_fox.jpg',      label: 'Renard' },
  { id: 'raccoon',  src: '/avatars/avatar_raccoon.jpg',  label: 'Raton' },
  { id: 'cat',      src: '/avatars/avatar_cat.jpg',      label: 'Chat' },
  { id: 'tanuki',   src: '/avatars/avatar_tanuki.jpg',   label: 'Tanuki' },
  { id: 'deer',     src: '/avatars/avatar_deer.jpg',     label: 'Biche' },
  { id: 'rabbit',   src: '/avatars/avatar_rabbit.jpg',   label: 'Lapin' },
  { id: 'owl',      src: '/avatars/avatar_owl.jpg',      label: 'Hibou' },
  { id: 'capybara', src: '/avatars/avatar_capybara.jpg', label: 'Capybara' },
  { id: 'bear',     src: '/avatars/avatar_bear.jpg',     label: 'Ours' },
  { id: 'hedgehog', src: '/avatars/avatar_hedgehog.jpg', label: 'Hérisson' },
  { id: 'frog',     src: '/avatars/avatar_frog.jpg',     label: 'Grenouille' },
  { id: 'crane',    src: '/avatars/avatar_crane.jpg',    label: 'Grue' },
];

/**
 * Given an avatarId, return the avatar src URL.
 * Falls back to null if not found.
 */
export function getAvatarSrc(avatarId) {
  return AVATARS.find((a) => a.id === avatarId)?.src || null;
}

export const DEFAULT_AVATAR_ID = 'fox';
