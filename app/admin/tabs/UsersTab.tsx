/**
 * Skeda "Përdoruesit" → ekrani i ri i Njerëzve.
 *
 * PeopleTab ndodhej në depo por nuk e thërriste asgjë, sepse page.tsx nuk
 * ishte përditësuar. Ky ridrejtim e bën të arritshëm menjëherë: i njëjti
 * emër eksporti, përmbajtje e re.
 *
 * Kur page.tsx të përditësohet, ky skedar hiqet dhe PeopleTab thirret
 * drejtpërdrejt nën emrin e vet.
 */
export { PeopleTab as UsersTab } from './PeopleTab'
