/**

 * docs/data/identification-models.md

 */



import type { DateDetail, ReferenceField } from './common'

import type { Person } from './actor'



export interface ObjectName {

  value?: ReferenceField

  type?: ReferenceField

  language?: ReferenceField

}



export interface TitleTranslation {

  value?: string

  translator?: Person

  translation_time?: DateDetail

  note?: string

}



export interface Title {

  value?: string

  type?: ReferenceField

  language?: ReferenceField

  translation?: TitleTranslation[]

  note?: string

}



export interface IdentificationDetails {

  object_type?: ReferenceField

  object_number?: string

  object_name?: ObjectName[]

  /** docs/data/identification-models.md — List<Title> */

  title?: Title[]

  number_of_objects?: number

}

