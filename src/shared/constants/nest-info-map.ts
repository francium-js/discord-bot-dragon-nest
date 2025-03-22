import { NestEnum } from 'src/shared/enums/nests'
import { bdm, bdn, ddn, pheonix, rdm, rdn, tcn } from './photo-links'
import { RareHexEnum } from 'src/shared/enums/rare-color'

export const nestInfoMap = {
  [NestEnum.VN]: {
    emoji: '1352121601956515861',
    name: 'Volcano Nest',
    description: '',
    imgUrl: pheonix,
    color: RareHexEnum.EPIC,
  },
  [NestEnum.TCN]: {
    emoji: '1352121604905242735',
    name: 'Thrid Core Nest',
    description: '',
    imgUrl: tcn,
    color: RareHexEnum.EPIC,
  },
  [NestEnum.VON]: {
    emoji: '1352121603495952405',
    name: 'Volcano Order Nest',
    description: '',
    imgUrl: pheonix,
    color: RareHexEnum.EPIC,
  },
  [NestEnum.BDM]: {
    emoji: '1352121600597819392',
    name: 'Black Dragon Memory',
    description: '',
    imgUrl: bdm,
    color: RareHexEnum.UNIQUE,
  },
  [NestEnum.RDM]: {
    emoji: '1352121612794855457',
    name: 'Red Dragon Memory',
    description: '',
    imgUrl: rdm,
    color: RareHexEnum.UNIQUE,
  },
  [NestEnum.BDN]: {
    emoji: '1352121614795411498',
    name: 'Black Dragon Nest',
    description: '',
    imgUrl: bdn,
    color: RareHexEnum.UNIQUE,
  },
  [NestEnum.DDN]: {
    emoji: '1352121618088071270',
    name: 'Desert Dragon Nest',
    description: '',
    imgUrl: ddn,
    color: RareHexEnum.UNIQUE,
  },
  [NestEnum.RDN]: {
    emoji: '1352121616615739402',
    name: 'Red Dragon Nest',
    description: '',
    imgUrl: rdn,
    color: RareHexEnum.UNIQUE,
  },
  [NestEnum.BDNHC]: {
    emoji: '1352119134888136796',
    name: 'Black Dragon Nest',
    description: '',
    imgUrl: bdn,
    color: RareHexEnum.LEGEND,
  },
  [NestEnum.DDNHC]: {
    emoji: '1352119134888136796',
    name: 'Desert Dragon Nest',
    description: '',
    imgUrl: ddn,
    color: RareHexEnum.LEGEND,
  },
  [NestEnum.RDNHC]: {
    emoji: '1352119134888136796',
    name: 'Red Dragon Nest',
    description: '',
    imgUrl: rdn,
    color: RareHexEnum.LEGEND,
  },
}
