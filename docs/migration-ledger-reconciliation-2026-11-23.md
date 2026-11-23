# Production migration-ledger reconciliation (read-only)

Generated: 2026-11-23T03:43:47.716Z

## Safety statement

This artifact is an audit mapping only. It does not insert rows into `__drizzle_migrations`, run `pnpm db:push`, replay SQL, or change production schema/data.

## Counts

- Production ledger rows: **147**
- Local SQL migration files: **136**
- Local journal entries: **129**
- Production SHA-256 rows mapped exactly to local SQL content: **34**
- Production rows mapped to local files after hash/name normalization: **147**
- Unique local SQL files represented after normalization: **98**
- Local SQL files absent from the normalized production ledger: **38**

## Normalized production mapping

| Production id | Created at | Mapping method | Local SQL file | Ledger hash/name |
|---:|---:|---|---|---|
| 1 | 1768335058868 | sha256-content | `0000_tan_trauma.sql` | `6d9502e7a85057774a5e764583ab8d6580e3588e8403f945cac77215c3973df2` |
| 2 | 1768340158540 | sha256-content | `0001_slimy_swordsman.sql` | `58c67cfe95a351f345695be0f3a7e6bf8f046912ff257220551a35ed05942023` |
| 3 | 1768340700904 | sha256-content | `0002_thankful_magma.sql` | `b78cda964027af6fdc5b0eac83dc83db5c0962deb204cfc4f054bff4c50a4d6b` |
| 4 | 1768342745156 | sha256-content | `0003_fresh_mimic.sql` | `5f4fc1e3b35ada051a4ed8efb884d2155b82a19bcc56f17a6bece2c26a000c98` |
| 5 | 1768343583157 | sha256-content | `0004_orange_wild_child.sql` | `f04422242efcb5b7b00b257e38eec595688c664eb7cd1428f7d864c13c8d4eb3` |
| 6 | 1768344283047 | sha256-content | `0005_superb_thing.sql` | `048239ad0ed33930f38e1e7575467591ab7f784bddceec1cef147fb4ce3ccfe8` |
| 7 | 1768345164476 | sha256-content | `0006_wise_lilith.sql` | `44d41f6e6a7b153f9c3cdfe40d4be410ad409c28d67125bac89df6240173b181` |
| 8 | 1768345593059 | sha256-content | `0007_wandering_brood.sql` | `8c72c9d68fbbc5c79f03e1509b77cabff27eae03719b879253f984387d7e831c` |
| 9 | 1768345980987 | sha256-content | `0008_oval_shooting_star.sql` | `752c96e4be57a7da17ac1eec9503f7de5939e3ad6327c379bf085752e54f3087` |
| 10 | 1768346969826 | sha256-content | `0009_magenta_bloodscream.sql` | `54b9b2ea63c0f750110c1d015dbff103a6bc82733f5ae73a2e7a1d979e35d7e4` |
| 11 | 1768351733999 | sha256-content | `0010_brainy_fantastic_four.sql` | `924e802d5bc9ba6c7a2c1ff21a4aab0a23611c7d8ffad3189bba51394c509657` |
| 12 | 1768371542869 | sha256-content | `0011_spooky_supreme_intelligence.sql` | `7bccd6e6033ef5b15dd9c74d1466cd440b9b9867ce354a491b75f73f6b6921ad` |
| 13 | 1768371599340 | sha256-content | `0012_bored_supreme_intelligence.sql` | `87c5f8e06c64f44ea919d270476178072ff58d4ea29a3a7a87256e99a6382cf1` |
| 14 | 1768454861437 | sha256-content | `0013_marvelous_xorn.sql` | `ab24a6503155c90e88254a81d6c586ef42f8835d1aa6a635711e1128b709a949` |
| 15 | 1768457523491 | sha256-content | `0015_reflective_hitman.sql` | `3a3a7397a5420ae7bbd20241116e9c5c796b524c351f4ff213a07a11d938f573` |
| 16 | 1768457542876 | sha256-content | `0015_reflective_hitman.sql` | `3a3a7397a5420ae7bbd20241116e9c5c796b524c351f4ff213a07a11d938f573` |
| 17 | 1768464282029 | sha256-content | `0016_unusual_omega_sentinel.sql` | `bcdda82b9063c9a78735338aba71a9b5653aa2bb58b6fa8b2b7577ca75f09aa2` |
| 18 | 1768495294406 | sha256-content | `0017_sturdy_lockheed.sql` | `eae442c098dc304f211e2a84a157287a21813caea5bb42c309d960f577babc77` |
| 19 | 1768521197915 | sha256-content | `0018_large_natasha_romanoff.sql` | `d1ccbce1d74626bc02210c47f26941fa413d3ca9f11fb9cf3dc826cdb6896bb8` |
| 20 | 1768531448954 | sha256-content | `0019_ordinary_argent.sql` | `0c621baf5e491043199a9932f751393d922a47ffea9d6defe0fcad7e314e8d81` |
| 21 | 1768537525623 | sha256-content | `0020_violet_fat_cobra.sql` | `72fa5280896c2d948b3d2479b08fd8c14abd50e33198f837b06487ffb8924c49` |
| 22 | 1770559529578 | sha256-content | `0021_many_tiger_shark.sql` | `667fa1b7a438d8b6e8a9cdbf6ad078e365f979d115050d3b332c74e265419778` |
| 23 | 1770560239157 | sha256-content | `0022_stale_william_stryker.sql` | `504dec1e2ef0897cafd621f026ffa6668bfdc7e4820ab7a1d2b51ffd6a6193f8` |
| 24 | 1770740952606 | sha256-content | `0023_zippy_squadron_sinister.sql` | `3e1c12909d15d946c5eec56b9c44e7b2d5828df74f01e02e97458f3e9eedc463` |
| 25 | 1770763857241 | sha256-content | `0024_long_nebula.sql` | `1e3d7b98e971383775531ae65b8e83bbed8df6fcafa7e55007f2bf4a0be94149` |
| 26 | 1770764120034 | sha256-content | `0025_cultured_eddie_brock.sql` | `ccf5e6c8786d47bf21cbb73858a867806220b670f1c534d21a3335a4207a3153` |
| 27 | 1770822156042 | sha256-content | `0026_graceful_sasquatch.sql` | `719ad466c446360e1bd8241b89bd3e11382584d10411b974a078e0afca3aca1c` |
| 28 | 1770830184821 | sha256-content | `0027_burly_mesmero.sql` | `675549c1cf64f0b3714f0300c5bde2d6cb95ed13370b10d644057e1a9c4407f7` |
| 29 | 1770916126508 | sha256-content | `0028_chemical_tomas.sql` | `c7672a87076e1f82752e1c6f2df85386a05212a96fab8c333c6a7459e9d0200e` |
| 30 | 1770937780490 | sha256-content | `0029_curly_black_queen.sql` | `930669fe3ae883fc29e03eece6d92a00e868f5f20334cacb544e049bb2efbcea` |
| 31 | 1770943518430 | sha256-content | `0030_smart_skaar.sql` | `7ae6f2fee2ba1fcb961f442f067ff1d878ed359cabc07ffc30cc2791eb0dd2aa` |
| 32 | 1770943645841 | sha256-content | `0031_greedy_colossus.sql` | `a515787eb163865f0c47e8a0593af03946711dd4a1e8baa46d0d6874d1723b71` |
| 33 | 1772370559555 | sha256-content | `0047_cold_giant_man.sql` | `b997c828421ad6a153386971e6463b82d1ecf1ec53785b68496851a1d720aa1b` |
| 34 | 1772375453219 | sha256-content | `0048_ambiguous_hiroim.sql` | `40277834bbf6cc3a321fb5412a3327fb7b50159842247548190c567cd4898c5c` |
| 36 | 1778549516213 | ledger-filename | `0058_blushing_maverick.sql` | `0058_blushing_maverick` |
| 37 | 1778549516234 | ledger-filename | `0059_glamorous_pepper_potts.sql` | `0059_glamorous_pepper_potts` |
| 38 | 1778549516254 | ledger-filename | `0060_colorful_typhoid_mary.sql` | `0060_colorful_typhoid_mary` |
| 39 | 1778549516269 | ledger-filename | `0061_lucky_jasper_sitwell.sql` | `0061_lucky_jasper_sitwell` |
| 40 | 1778549516352 | ledger-filename | `0062_brave_silver_centurion.sql` | `0062_brave_silver_centurion` |
| 41 | 1778549516596 | ledger-filename | `0063_eager_impossible_man.sql` | `0063_eager_impossible_man` |
| 42 | 1778549516628 | ledger-filename | `0064_wakeful_sunspot.sql` | `0064_wakeful_sunspot` |
| 43 | 1778549516659 | ledger-filename | `0065_large_red_wolf.sql` | `0065_large_red_wolf` |
| 44 | 1778549516712 | ledger-filename | `0066_slippery_sway.sql` | `0066_slippery_sway` |
| 45 | 1778549516727 | ledger-filename | `0067_greedy_punisher.sql` | `0067_greedy_punisher` |
| 46 | 1778549516792 | ledger-filename | `0068_volatile_hellfire_club.sql` | `0068_volatile_hellfire_club` |
| 47 | 1778549516822 | ledger-filename | `0069_aspiring_vanisher.sql` | `0069_aspiring_vanisher` |
| 48 | 1778549516835 | ledger-filename | `0070_eminent_winter_soldier.sql` | `0070_eminent_winter_soldier` |
| 49 | 1778549516864 | ledger-filename | `0071_smart_hydra.sql` | `0071_smart_hydra` |
| 50 | 1778549516873 | ledger-filename | `0072_lively_medusa.sql` | `0072_lively_medusa` |
| 51 | 1781627173376 | ledger-filename | `0001_slimy_swordsman.sql` | `0001_slimy_swordsman` |
| 52 | 1781627173410 | ledger-filename | `0002_thankful_magma.sql` | `0002_thankful_magma` |
| 53 | 1781627173484 | ledger-filename | `0003_fresh_mimic.sql` | `0003_fresh_mimic` |
| 54 | 1781627173507 | ledger-filename | `0004_orange_wild_child.sql` | `0004_orange_wild_child` |
| 55 | 1781627173517 | ledger-filename | `0005_superb_thing.sql` | `0005_superb_thing` |
| 56 | 1781627173541 | ledger-filename | `0006_wise_lilith.sql` | `0006_wise_lilith` |
| 57 | 1781627173560 | ledger-filename | `0007_wandering_brood.sql` | `0007_wandering_brood` |
| 58 | 1781627173577 | ledger-filename | `0008_oval_shooting_star.sql` | `0008_oval_shooting_star` |
| 59 | 1781627173722 | ledger-filename | `0009_magenta_bloodscream.sql` | `0009_magenta_bloodscream` |
| 60 | 1781627173752 | ledger-filename | `0010_brainy_fantastic_four.sql` | `0010_brainy_fantastic_four` |
| 61 | 1781627173932 | ledger-filename | `0011_spooky_supreme_intelligence.sql` | `0011_spooky_supreme_intelligence` |
| 62 | 1781627174037 | ledger-filename | `0012_bored_supreme_intelligence.sql` | `0012_bored_supreme_intelligence` |
| 63 | 1781627174045 | ledger-filename | `0013_marvelous_xorn.sql` | `0013_marvelous_xorn` |
| 64 | 1781627174055 | ledger-filename | `0014_sudden_jackpot.sql` | `0014_sudden_jackpot` |
| 65 | 1781627174062 | ledger-filename | `0015_reflective_hitman.sql` | `0015_reflective_hitman` |
| 66 | 1781627174089 | ledger-filename | `0016_unusual_omega_sentinel.sql` | `0016_unusual_omega_sentinel` |
| 67 | 1781627174349 | ledger-filename | `0017_sturdy_lockheed.sql` | `0017_sturdy_lockheed` |
| 68 | 1781627174368 | ledger-filename | `0018_comprehensive_rider_template.sql` | `0018_comprehensive_rider_template` |
| 69 | 1781627179034 | ledger-filename | `0018_large_natasha_romanoff.sql` | `0018_large_natasha_romanoff` |
| 70 | 1781627179117 | ledger-filename | `0019_ordinary_argent.sql` | `0019_ordinary_argent` |
| 71 | 1781627179126 | ledger-filename | `0019_rider_acknowledgment.sql` | `0019_rider_acknowledgment` |
| 72 | 1781627179176 | ledger-filename | `0020_violet_fat_cobra.sql` | `0020_violet_fat_cobra` |
| 73 | 1781627179184 | ledger-filename | `0021_fix_signatures_columns.sql` | `0021_fix_signatures_columns` |
| 74 | 1781627182144 | ledger-filename | `0021_many_tiger_shark.sql` | `0021_many_tiger_shark` |
| 75 | 1781627182156 | ledger-filename | `0022_create_signatures_table.sql` | `0022_create_signatures_table` |
| 76 | 1781627182186 | ledger-filename | `0022_stale_william_stryker.sql` | `0022_stale_william_stryker` |
| 77 | 1781627182200 | ledger-filename | `0023_phase2b_venue_reviews_booking_templates.sql` | `0023_phase2b_venue_reviews_booking_templates` |
| 78 | 1781627182242 | ledger-filename | `0023_zippy_squadron_sinister.sql` | `0023_zippy_squadron_sinister` |
| 79 | 1781627182298 | ledger-filename | `0024_long_nebula.sql` | `0024_long_nebula` |
| 80 | 1781627182325 | ledger-filename | `0025_cultured_eddie_brock.sql` | `0025_cultured_eddie_brock` |
| 81 | 1781627182338 | ledger-filename | `0026_graceful_sasquatch.sql` | `0026_graceful_sasquatch` |
| 82 | 1781627182393 | ledger-filename | `0027_burly_mesmero.sql` | `0027_burly_mesmero` |
| 83 | 1781627182485 | ledger-filename | `0028_chemical_tomas.sql` | `0028_chemical_tomas` |
| 84 | 1781627182525 | ledger-filename | `0029_curly_black_queen.sql` | `0029_curly_black_queen` |
| 85 | 1781627182567 | ledger-filename | `0030_smart_skaar.sql` | `0030_smart_skaar` |
| 86 | 1781627182688 | ledger-filename | `0031_greedy_colossus.sql` | `0031_greedy_colossus` |
| 87 | 1781627182734 | ledger-filename | `0032_spotty_meteorite.sql` | `0032_spotty_meteorite` |
| 88 | 1781627182748 | ledger-filename | `0033_gifted_texas_twister.sql` | `0033_gifted_texas_twister` |
| 89 | 1781627182895 | ledger-filename | `0034_simple_scalphunter.sql` | `0034_simple_scalphunter` |
| 90 | 1781627182920 | ledger-filename | `0035_secret_maximus.sql` | `0035_secret_maximus` |
| 91 | 1781627182954 | ledger-filename | `0036_public_magma.sql` | `0036_public_magma` |
| 92 | 1781627183488 | ledger-filename | `0036_soft_warhawk.sql` | `0036_soft_warhawk` |
| 93 | 1781627183706 | ledger-filename | `0037_typical_jigsaw.sql` | `0037_typical_jigsaw` |
| 94 | 1781627183829 | ledger-filename | `0038_tiny_phil_sheldon.sql` | `0038_tiny_phil_sheldon` |
| 95 | 1781627183852 | ledger-filename | `0039_bright_blacklash.sql` | `0039_bright_blacklash` |
| 96 | 1781627183892 | ledger-filename | `0040_calm_cammi.sql` | `0040_calm_cammi` |
| 97 | 1781627184006 | ledger-filename | `0041_amusing_randall_flagg.sql` | `0041_amusing_randall_flagg` |
| 98 | 1781627184030 | ledger-filename | `0042_handy_mister_sinister.sql` | `0042_handy_mister_sinister` |
| 99 | 1781627184036 | ledger-filename | `0043_perfect_ogun.sql` | `0043_perfect_ogun` |
| 100 | 1781627184149 | ledger-filename | `0044_tranquil_alex_wilder.sql` | `0044_tranquil_alex_wilder` |
| 101 | 1781627184254 | ledger-filename | `0045_bitter_miss_america.sql` | `0045_bitter_miss_america` |
| 102 | 1781627184277 | ledger-filename | `0046_certain_mockingbird.sql` | `0046_certain_mockingbird` |
| 103 | 1781627184769 | ledger-filename | `0047_cold_giant_man.sql` | `0047_cold_giant_man` |
| 104 | 1781627184798 | ledger-filename | `0048_ambiguous_hiroim.sql` | `0048_ambiguous_hiroim` |
| 105 | 1781627184823 | ledger-filename | `0049_black_gamora.sql` | `0049_black_gamora` |
| 106 | 1781627185048 | ledger-filename | `0050_cloudy_psylocke.sql` | `0050_cloudy_psylocke` |
| 107 | 1781627185100 | ledger-filename | `0051_nostalgic_masked_marvel.sql` | `0051_nostalgic_masked_marvel` |
| 108 | 1781627185110 | ledger-filename | `0052_old_moira_mactaggert.sql` | `0052_old_moira_mactaggert` |
| 109 | 1781627185127 | ledger-filename | `0053_puzzling_grey_gargoyle.sql` | `0053_puzzling_grey_gargoyle` |
| 110 | 1781627185135 | ledger-filename | `0054_abandoned_midnight.sql` | `0054_abandoned_midnight` |
| 111 | 1781627185151 | ledger-filename | `0055_high_tag.sql` | `0055_high_tag` |
| 112 | 1781627185165 | ledger-filename | `0056_mean_madame_hydra.sql` | `0056_mean_madame_hydra` |
| 113 | 1781627185173 | ledger-filename | `0057_omniscient_titania.sql` | `0057_omniscient_titania` |
| 114 | 1781627185255 | ledger-filename | `0058_blushing_maverick.sql` | `0058_blushing_maverick` |
| 115 | 1781627185269 | ledger-filename | `0059_glamorous_pepper_potts.sql` | `0059_glamorous_pepper_potts` |
| 116 | 1781627185285 | ledger-filename | `0060_colorful_typhoid_mary.sql` | `0060_colorful_typhoid_mary` |
| 117 | 1781627185293 | ledger-filename | `0061_lucky_jasper_sitwell.sql` | `0061_lucky_jasper_sitwell` |
| 118 | 1781627185317 | ledger-filename | `0062_brave_silver_centurion.sql` | `0062_brave_silver_centurion` |
| 119 | 1781627185332 | ledger-filename | `0063_eager_impossible_man.sql` | `0063_eager_impossible_man` |
| 120 | 1781627185351 | ledger-filename | `0064_wakeful_sunspot.sql` | `0064_wakeful_sunspot` |
| 121 | 1781627185377 | ledger-filename | `0065_large_red_wolf.sql` | `0065_large_red_wolf` |
| 122 | 1781627185423 | ledger-filename | `0066_slippery_sway.sql` | `0066_slippery_sway` |
| 123 | 1781627185434 | ledger-filename | `0067_greedy_punisher.sql` | `0067_greedy_punisher` |
| 124 | 1781627185479 | ledger-filename | `0068_volatile_hellfire_club.sql` | `0068_volatile_hellfire_club` |
| 125 | 1781627185505 | ledger-filename | `0069_aspiring_vanisher.sql` | `0069_aspiring_vanisher` |
| 126 | 1781627185516 | ledger-filename | `0070_eminent_winter_soldier.sql` | `0070_eminent_winter_soldier` |
| 127 | 1781627185555 | ledger-filename | `0071_smart_hydra.sql` | `0071_smart_hydra` |
| 128 | 1781627185563 | ledger-filename | `0072_lively_medusa.sql` | `0072_lively_medusa` |
| 129 | 1781627185593 | ledger-filename | `0073_cultured_wolfsbane.sql` | `0073_cultured_wolfsbane` |
| 130 | 1781627185749 | ledger-filename | `0074_nice_argent.sql` | `0074_nice_argent` |
| 131 | 1781627185873 | ledger-filename | `0075_special_stark_industries.sql` | `0075_special_stark_industries` |
| 132 | 1781627185943 | ledger-filename | `0076_salty_donald_blake.sql` | `0076_salty_donald_blake` |
| 133 | 1781627186210 | ledger-filename | `0077_fair_justin_hammer.sql` | `0077_fair_justin_hammer` |
| 134 | 1781627186315 | ledger-filename | `0078_aromatic_skaar.sql` | `0078_aromatic_skaar` |
| 135 | 1781627186425 | ledger-filename | `0079_outgoing_starfox.sql` | `0079_outgoing_starfox` |
| 136 | 1781627186748 | ledger-filename | `0080_illegal_star_brand.sql` | `0080_illegal_star_brand` |
| 137 | 1781627186761 | ledger-filename | `0081_chubby_ravenous.sql` | `0081_chubby_ravenous` |
| 138 | 1781627186822 | ledger-filename | `0082_many_hardball.sql` | `0082_many_hardball` |
| 139 | 1781627186881 | ledger-filename | `0083_flawless_thunderbird.sql` | `0083_flawless_thunderbird` |
| 140 | 1781627186962 | ledger-filename | `0084_majestic_eddie_brock.sql` | `0084_majestic_eddie_brock` |
| 141 | 1781627186979 | ledger-filename | `0085_far_frank_castle.sql` | `0085_far_frank_castle` |
| 142 | 1781627186998 | ledger-filename | `0086_flat_wilson_fisk.sql` | `0086_flat_wilson_fisk` |
| 143 | 1781627187007 | ledger-filename | `0087_last_mandrill.sql` | `0087_last_mandrill` |
| 144 | 1781627187019 | ledger-filename | `0088_petite_sabra.sql` | `0088_petite_sabra` |
| 145 | 1781627187027 | ledger-filename | `0089_real_redwing.sql` | `0089_real_redwing` |
| 146 | 1781627187035 | ledger-filename | `0090_fluffy_radioactive_man.sql` | `0090_fluffy_radioactive_man` |
| 147 | 1781627187330 | ledger-filename | `0091_magenta_sentinels.sql` | `0091_magenta_sentinels` |
| 35 | 20260306213254 | ledger-filename | `0057_omniscient_titania.sql` | `0057_omniscient_titania` |

## Local SQL files absent from the normalized production ledger

- `0092_stormy_makkari.sql`
- `0093_tan_ink.sql`
- `0094_wise_zemo.sql`
- `0095_rich_the_spike.sql`
- `0096_little_annihilus.sql`
- `0097_huge_gauntlet.sql`
- `0098_unknown_unus.sql`
- `0099_icy_molecule_man.sql`
- `0099_talented_bulldozer.sql`
- `0100_ology_live.sql`
- `0100_tidy_sabretooth.sql`
- `0101_tidy_catseye.sql`
- `0102_cultured_talkback.sql`
- `0103_silent_nitro.sql`
- `0104_merch_schema_repair.sql`
- `0105_furry_colonel_america.sql`
- `0106_video_portfolio_schema_repair.sql`
- `0107_square_trish_tilby.sql`
- `0108_bouncy_corsair.sql`
- `0109_mysterious_war_machine.sql`
- `0110_optimal_starjammers.sql`
- `0111_furry_goblin_queen.sql`
- `0112_grey_triton.sql`
- `0113_boring_gunslinger.sql`
- `0114_rich_wendigo.sql`
- `0115_nifty_madame_masque.sql`
- `0116_panoramic_sphinx.sql`
- `0117_fan_email_consents.sql`
- `0118_glorious_omega_sentinel.sql`
- `0119_nebulous_sleeper.sql`
- `0120_shiny_sleepwalker.sql`
- `0121_misty_squadron_supreme.sql`
- `0122_edu_renewal_review_lifecycle.sql`
- `0123_edu_billing_notices.sql`
- `0124_edu_notice_resolution_audit.sql`
- `0125_outgoing_synch.sql`
- `0126_reflective_changeling.sql`
- `0127_burly_stick.sql`

## DBA/release-owner action required

All production ledger rows map to local SQL filenames or exact SHA-256 content, but 38 local SQL files are not represented in the normalized ledger. Confirm from deployment history and schema inspection whether those files were applied through another release path, renamed, superseded, or are only local/unreleased work. Document that mapping before considering any metadata repair. Do not infer that a missing ledger row means SQL should be replayed.

## Source files

- `drizzle/meta/_journal.json`
- `drizzle/*.sql`
- Production table `__drizzle_migrations` (read-only query)
