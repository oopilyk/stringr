#!/bin/bash

# Fix all TypeScript implicit 'any' errors systematically

echo "Fixing TypeScript errors..."

# Fix step2-background.tsx
sed -i '' 's/current\.filter((l) => l !== level)/current.filter((l: string) => l !== level)/g' components/stringer-onboarding/step2-background.tsx
sed -i '' 's/setValue("certifications", \[\.\.\.current, cert\])/setValue("certifications", [...current, cert])/g' components/stringer-onboarding/step2-background.tsx
sed -i '' 's/serviceLocations\.map((location) =>/serviceLocations.map((location: string) =>/g' components/stringer-onboarding/step2-background.tsx
sed -i '' 's/\.map((level) => (/\.map((level: string) => (/g' components/stringer-onboarding/step2-background.tsx

# Fix step3-equipment.tsx
sed -i '' 's/machineTypes\.map((t) => (/machineTypes.map((t: string) => (/g' components/stringer-onboarding/step3-equipment.tsx
sed -i '' 's/stringBrands\.map((brand) => (/stringBrands.map((brand: string) => (/g' components/stringer-onboarding/step3-equipment.tsx
sed -i '' 's/\.map((type) => (/\.map((type: string) => (/g' components/stringer-onboarding/step3-equipment.tsx

# Fix step6-availability.tsx
sed -i '' 's/availabilityMethod\.map((m) => (/availabilityMethod.map((m: string) => (/g' components/stringer-onboarding/step6-availability.tsx

# Fix step7-review.tsx
sed -i '' 's/stringInventory\.map((item, idx) => (/stringInventory.map((item: any, idx: number) => (/g' components/stringer-onboarding/step7-review.tsx
sed -i '' 's/availability\.map((m) => (/availability.map((m: any) => (/g' components/stringer-onboarding/step7-review.tsx

# Fix string-inventory-manager.tsx
sed -i '' 's/presets\.map((preset) => (/presets.map((preset: any) => (/g' components/stringer-onboarding/string-inventory-manager.tsx

# Fix stringer profile page
sed -i '' 's/certifications\.map((cert, i) => (/certifications.map((cert: string, i: number) => (/g' app/stringer/[id]/page.tsx

# Fix racket-gallery.tsx
sed -i '' 's/onChange={(e) => setEditForm/onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm/g' components/profile/racket-gallery.tsx
sed -i '' 's/onChange={(e) => handleStringTypeChange/onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStringTypeChange/g' components/profile/racket-gallery.tsx

echo "TypeScript errors fixed!"
