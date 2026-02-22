import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { 
  Package, Shield, Navigation, Zap, Phone, Radio, Eye, Smartphone, 
  Tent, Heart, Wrench, Settings, Hammer, Droplets, Cookie, Sun, 
  Glasses, Shirt, Cloud, Snowflake, Map, Volume2, Filter, 
  Cog, Wallet, FileText
} from 'lucide-react';

interface EquipmentDownloadStepProps {
  onContinue: () => void;
}

export function EquipmentDownloadStep({ onContinue }: EquipmentDownloadStepProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const equipmentItems = [
    {
      id: 'helmet',
      title: 'A certified helmet',
      description: 'Properly fitted and certified cycling helmet for head protection',
      icon: Shield,
      category: 'Essential'
    },
    {
      id: 'phone',
      title: 'A phone with emergency contacts saved',
      description: 'Save numbers as ICE (In Case of Emergency) or set up emergency cards on your phone',
      icon: Phone,
      category: 'Essential'
    },
    {
      id: 'sos-tracker',
      title: 'A satellite SOS tracker',
      description: 'With your emergency profile loaded — recommended for safety in case of emergency where evacuation or airlift is required through your SOS service provider',
      icon: Radio,
      category: 'Essential'
    },
    {
      id: 'lights',
      title: 'Front and rear lights suitable for riding through the night',
      description: 'Powerful LED lights with sufficient battery life for night riding',
      icon: Zap,
      category: 'Essential'
    },
    {
      id: 'reflective-vest',
      title: 'Reflective vest (must be worn between sunset and sunrise)',
      description: 'High-visibility vest for safety during low-light conditions',
      icon: Eye,
      category: 'Essential'
    },
    {
      id: 'navigation',
      title: 'A navigation device with GPX file loaded and an additional power bank',
      description: 'GPS device or smartphone with route loaded and backup power source',
      icon: Navigation,
      category: 'Essential'
    },
    {
      id: 'backup-phone',
      title: 'A fully charged backup phone (recommended)',
      description: 'Secondary phone as backup for navigation and communication',
      icon: Smartphone,
      category: 'Recommended'
    },
    {
      id: 'emergency-foil',
      title: 'An emergency survival foil bag to provide shelter and warmth',
      description: 'Lightweight emergency shelter for hypothermia prevention',
      icon: Tent,
      category: 'Recommended'
    },
    {
      id: 'first-aid',
      title: 'A first aid kit with essential supplies for minor injuries',
      description: 'Basic medical supplies for treating cuts, scrapes, and minor injuries',
      icon: Heart,
      category: 'Recommended'
    },
    {
      id: 'tire-repair',
      title: 'Spare inner tubes, tubeless plugs, patch kit, and mini-pump or CO₂ inflator',
      description: 'Complete tire repair kit for punctures and mechanical issues',
      icon: Wrench,
      category: 'Recommended'
    },
    {
      id: 'chain-tools',
      title: 'A chain quick link and spare derailleur hanger',
      description: 'Essential drivetrain spare parts for chain and derailleur repairs',
      icon: Settings,
      category: 'Recommended'
    },
    {
      id: 'multi-tool',
      title: 'A reliable multi-tool',
      description: 'Comprehensive bike tool for adjustments and basic repairs',
      icon: Hammer,
      category: 'Recommended'
    },
    {
      id: 'water',
      title: 'Water bottles or a hydration system with up to 5 litres capacity per 100 km section',
      description: 'Adequate water storage for hydration between refill points',
      icon: Droplets,
      category: 'Recommended'
    },
    {
      id: 'food',
      title: 'Food and supplies sufficient to provide about 50 g of carbohydrates per hour',
      description: 'Plan to sustain yourself for up to 24 hours without refuelling points (approx. 1,200 g carbs required)',
      icon: Cookie,
      category: 'Recommended'
    },
    {
      id: 'sunscreen',
      title: 'Sunscreen for skin protection',
      description: 'High SPF sunscreen for prolonged sun exposure protection',
      icon: Sun,
      category: 'Recommended'
    },
    {
      id: 'sunglasses',
      title: 'Sunglasses for eye protection',
      description: 'UV protection glasses for eye safety and visibility',
      icon: Glasses,
      category: 'Recommended'
    },
    {
      id: 'weather-protection',
      title: 'Lightweight gloves, arm/leg warmers, or buff for weather protection',
      description: 'Versatile clothing items for temperature regulation',
      icon: Shirt,
      category: 'Recommended'
    },
    {
      id: 'rain-jacket',
      title: 'A rain jacket or poncho',
      description: 'Waterproof protection for wet weather conditions',
      icon: Cloud,
      category: 'Recommended'
    },
    {
      id: 'warm-clothing',
      title: 'A suitable jacket and warm clothing layers',
      description: 'Insulation layers for cold weather and temperature drops',
      icon: Snowflake,
      category: 'Recommended'
    },
    {
      id: 'backup-navigation',
      title: 'Offline maps or backup navigation on a second device or phone',
      description: 'Secondary navigation system in case primary device fails',
      icon: Map,
      category: 'Recommended'
    },
    {
      id: 'whistle',
      title: 'A whistle for signaling in emergencies',
      description: 'Emergency signaling device for attracting attention',
      icon: Volume2,
      category: 'Optional'
    },
    {
      id: 'water-purification',
      title: 'Water purification tablets or filter (recommended for remote routes)',
      description: 'Water treatment for drinking from natural sources',
      icon: Filter,
      category: 'Optional'
    },
    {
      id: 'spoke-tools',
      title: 'Lightweight spoke key or spare spoke (optional but useful)',
      description: 'Tools and parts for wheel repairs and spoke replacement',
      icon: Cog,
      category: 'Optional'
    },
    {
      id: 'chamois-cream',
      title: 'Chamois cream or blister plasters to prevent overuse injuries',
      description: 'Comfort and injury prevention supplies for long-distance riding',
      icon: Heart,
      category: 'Optional'
    },
    {
      id: 'cash',
      title: 'Cash in small bills for emergencies',
      description: 'Emergency funds for unexpected situations or services',
      icon: Wallet,
      category: 'Optional'
    },
    {
      id: 'identification',
      title: 'Identification documents (ID, insurance card, emergency contacts) stored in a waterproof pouch',
      description: 'Essential documents protected from weather and easily accessible',
      icon: FileText,
      category: 'Optional'
    }
  ];

  const handleItemCheck = (itemId: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
          <Package className="h-8 w-8 text-primary" />
        </div>
        <h1>Equipment Checklist</h1>
        <p className="text-muted-foreground">
          Review essential and recommended gear for your ultracycling adventure
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          {equipmentItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg border border-muted/30 hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/30 flex-shrink-0 mt-1">
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={item.id} className="cursor-pointer">{item.title}</Label>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.category === 'Essential' 
                          ? 'bg-destructive/20 text-destructive' 
                          : item.category === 'Recommended'
                          ? 'bg-warning/20 text-warning'
                          : 'bg-muted/30 text-muted-foreground'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    <Checkbox
                      id={item.id}
                      checked={checkedItems[item.id] || false}
                      onCheckedChange={(checked) => handleItemCheck(item.id, !!checked)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {checkedCount > 0 && (
          <div className="text-center p-3 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-sm text-success">
              ✓ {checkedCount} of {equipmentItems.length} items checked
            </p>
          </div>
        )}
      </Card>

      <div className="bg-muted/30 border border-muted rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          💡 This checklist is optional but helps ensure you're prepared. You can continue when ready.
        </p>
      </div>

      <div className="pt-4">

      </div>
    </div>
  );
}