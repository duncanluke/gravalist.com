#!/bin/bash
cd /Users/duncanluke/Desktop/gravalist.com

# Create mapping
declare -A file_map=(
  ["9464dfd2105757c5fa4f6d670c7738d30cc29fac"]="logo.png"
  ["42729efa66cb7165298f83426d655e77b8f6547b"]="home-hero.png"
  ["b2a49a83e95b47c02c3bfbf9fb4f2e8c2348dcc5"]="home-bg-2.png"
  ["91ed571dcd1c837c1dd53b706f087421f7aa7e37"]="home-bg-3.png"
  ["d83cac3f6ed1575b9e8b3fb2350abc8ce2336865"]="rides-hero.png"
  ["52188f341c0009d39d6eb7f216ca4685431aa1a8"]="new-rides-hero.png"
  ["179788ffd73d8a7beb6bd2d5274578f266829fa1"]="generic-1.png"
  ["3f05f1f68be9c9aa46b0197083e99e8142bc0168"]="generic-2.png"
  ["d6c53ad4383c7c5567748a70f2b639165258ed5d"]="generic-3.png"
)

# Rename files in src/assets
for hash in "${!file_map[@]}"; do
  new_name="${file_map[$hash]}"
  if [ -f "src/assets/${hash}.png" ]; then
    echo "Renaming $hash.png to $new_name"
    mv "src/assets/${hash}.png" "src/assets/${new_name}"
  fi
done

# We also need to fix missing base URL paths if they were just aliased. 
# Determine OS for sed
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_I="sed -i ''"
else
  SED_I="sed -i"
fi

# Replace imports
for hash in "${!file_map[@]}"; do
  new_name="${file_map[$hash]}"
  echo "Replacing figma:asset/${hash}.png with @/assets/${new_name}"
  find src -type f -name "*.tsx" -exec $SED_I "s|figma:asset/${hash}\.png|@/assets/${new_name}|g" {} +
done
