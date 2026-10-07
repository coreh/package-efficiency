package main

import "fmt"

// The shop's data: an item is computed from its id (see ../../../README.md).

var allTags = []string{"alpha", "beta", "gamma", "delta"}

type Related struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	PriceCents int    `json:"priceCents"`
}

type Item struct {
	ID              int       `json:"id"`
	Name            string    `json:"name"`
	PriceCents      int       `json:"priceCents"`
	InStock         bool      `json:"inStock"`
	DiscountPercent int       `json:"discountPercent"`
	Note            string    `json:"note"`
	Tags            []string  `json:"tags"`
	Related         []Related `json:"related"`
}

func priceCents(id int) int { return 199 + (id*37)%5000 }

// A price as the pages show it: 236 cents is $2.36. The templates call it.
func price(cents int) string { return fmt.Sprintf("$%d.%02d", cents/100, cents%100) }

func (item Item) Price() string       { return price(item.PriceCents) }
func (related Related) Price() string { return price(related.PriceCents) }

func newItem(id int) Item {
	item := Item{
		ID:         id,
		Name:       fmt.Sprintf("Item %d", id),
		PriceCents: priceCents(id),
		InStock:    id%3 != 0,
		Note:       fmt.Sprintf("Fish & Chips <%d> \"quoted\" it's", id),
		Tags:       allTags[:id%4+1],
		Related:    make([]Related, 12),
	}
	if id%5 == 0 {
		item.DiscountPercent = 15
	}
	for i := range item.Related {
		other := id + i + 1
		item.Related[i] = Related{ID: other, Name: fmt.Sprintf("Item %d", other), PriceCents: priceCents(other)}
	}
	return item
}
