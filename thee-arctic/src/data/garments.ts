// Product imagery comes only from the brand's own photos (Product.images / site.ts).
// No drawn or generated stand-in art: where no photo has been supplied yet, the image area stays empty.

export type Garment =
  | 'tee' | 'top' | 'hoodie' | 'jacket' | 'shirt' | 'pants' | 'leggings' | 'shorts' | 'dress'
  | 'jumpsuit' | 'set' | 'swim' | 'bra' | 'shoe' | 'bag' | 'cap' | 'bottle' | 'compact' | 'skirt';

/** Kept so existing call sites compile; renders nothing until real photos are added. */
export function garmentSvg(_type: Garment, _hex: string): string {
  return '';
}
