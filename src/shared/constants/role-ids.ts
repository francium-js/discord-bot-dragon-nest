import { NestEnum } from 'src/shared/enums/nests'
import { ServerRegionEnum } from '../enums/server-region'

export const roleIdsMap = {
  [NestEnum.VN]: '1351930079143526540',
  [NestEnum.TCN]: '1351930118431572161',
  [NestEnum.VON]: '1351929988378525696',
  [NestEnum.BDM]: '1351930165495861248',
  [NestEnum.RDM]: '1351930247276269671',
  [NestEnum.BDN]: '1353039303655292958',
  [NestEnum.DDN]: '1353039417941688361',
  [NestEnum.RDN]: '1353039523776561233',
  [NestEnum.BDN_HC]: '1353039603174739988',
  [NestEnum.DDN_HC]: '1353039869609246730',
  [NestEnum.RDN_HC]: '1353039948206575666',
  [ServerRegionEnum.EU]: '1352740034150928480',
  [ServerRegionEnum.NA]: '1352756068857548810',
  [ServerRegionEnum.SEA]: '1352756134120783943',
  [ServerRegionEnum.SA]: '1352756331521507368',
}
