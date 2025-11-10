<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BadgeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // First, insert all badges without prerequisites
        $badges = [
            // Acquired Sign Ups - Tiered Badges
            [
                'slug' => 'acquired-sign-ups-bronze',
                'name' => 'Bronze Sign Up Achiever',
                'description' => 'Acquired 1 CPA Sign Up',
                'image_url' => null,
                'category' => 'sign_ups',
                'tier' => 'bronze',
                'color' => '#CD7F32',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'widget_data_cpa_realtime',
                    'user_column' => 'operator',
                    'user_id_mapping' => [
                        'type' => 'halo_id'
                    ],
                    'count_column' => 'total_sign_ups_current',
                    'date_column' => 'created_at',
                ]),
                'threshold' => 10,
                'points' => 10,
                'sort_order' => 1,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'acquired-sign-ups-silver',
                'name' => 'Silver Sign Up Achiever',
                'description' => 'Acquired 10 CPA Sign Ups',
                'image_url' => null,
                'category' => 'sign_ups',
                'tier' => 'silver',
                'color' => '#C0C0C0',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'widget_data_cpa_realtime',
                    'user_column' => 'operator',
                    'user_id_mapping' => [
                        'type' => 'halo_id'
                    ],
                    'count_column' => 'total_sign_ups_current',
                    'date_column' => 'created_at',
                ]),
                'threshold' => 100,
                'points' => 100,
                'sort_order' => 2,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'acquired-sign-ups-gold',
                'name' => 'Gold Sign Up Achiever',
                'description' => 'Acquired 50 CPA Sign Ups',
                'image_url' => null,
                'category' => 'sign_ups',
                'tier' => 'gold',
                'color' => '#FFD700',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'widget_data_cpa_realtime',
                    'user_column' => 'operator',
                    'user_id_mapping' => [
                        'type' => 'halo_id'
                    ],
                    'count_column' => 'total_sign_ups_current',
                    'date_column' => 'created_at',
                ]),
                'threshold' => 500,
                'points' => 500,
                'sort_order' => 3,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'acquired-sign-ups-platinum',
                'name' => 'Platinum Sign Up Achiever',
                'description' => 'Acquired 100 CPA Sign Ups',
                'image_url' => null,
                'category' => 'sign_ups',
                'tier' => 'platinum',
                'color' => '#E5E4E2',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'widget_data_cpa_realtime',
                    'user_column' => 'operator',
                    'user_id_mapping' => [
                        'type' => 'halo_id'
                    ],
                    'count_column' => 'total_sign_ups_current',
                    'date_column' => 'created_at',
                ]),
                'threshold' => 1000,
                'points' => 1000,
                'sort_order' => 4,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'acquired-sign-ups-emerald',
                'name' => 'Emerald Sign Up Achiever',
                'description' => 'Acquired 250 CPA Sign Ups',
                'image_url' => null,
                'category' => 'sign_ups',
                'tier' => 'emerald',
                'color' => '#50C878',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'widget_data_cpa_realtime',
                    'user_column' => 'operator',
                    'user_id_mapping' => [
                        'type' => 'halo_id'
                    ],
                    'count_column' => 'total_sign_ups_current',
                    'date_column' => 'created_at',
                ]),
                'threshold' => 2500,
                'points' => 2500,
                'sort_order' => 5,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'acquired-sign-ups-ruby',
                'name' => 'Ruby Sign Up Achiever',
                'description' => 'Acquired 500 CPA Sign Ups',
                'image_url' => null,
                'category' => 'sign_ups',
                'tier' => 'ruby',
                'color' => '#E0115F',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'widget_data_cpa_realtime',
                    'user_column' => 'operator',
                    'user_id_mapping' => [
                        'type' => 'halo_id'
                    ],
                    'count_column' => 'total_sign_ups_current',
                    'date_column' => 'created_at',
                ]),
                'threshold' => 5000,
                'points' => 5000,
                'sort_order' => 6,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'acquired-sign-ups-sapphire',
                'name' => 'Sapphire Sign Up Achiever',
                'description' => 'Acquired 750 CPA Sign Ups',
                'image_url' => null,
                'category' => 'sign_ups',
                'tier' => 'sapphire',
                'color' => '#0F52BA',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'widget_data_cpa_realtime',
                    'user_column' => 'operator',
                    'user_id_mapping' => [
                        'type' => 'halo_id'
                    ],
                    'count_column' => 'total_sign_ups_current',
                    'date_column' => 'created_at',
                ]),
                'threshold' => 750,
                'points' => 7500,
                'sort_order' => 7,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'acquired-sign-ups-diamond',
                'name' => 'Diamond Sign Up Achiever',
                'description' => 'Acquired 1,000 CPA Sign Ups',
                'image_url' => null,
                'category' => 'sign_ups',
                'tier' => 'diamond',
                'color' => '#B9F2FF',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'widget_data_cpa_realtime',
                    'user_column' => 'operator',
                    'user_id_mapping' => [
                        'type' => 'halo_id'
                    ],
                    'count_column' => 'total_sign_ups_current',
                    'date_column' => 'created_at',
                ]),
                'threshold' => 1000,
                'points' => 10000,
                'sort_order' => 8,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'acquired-sign-ups-alexandrite',
                'name' => 'Alexandrite Sign Up Achiever',
                'description' => 'Acquired 2,000 CPA Sign Ups',
                'image_url' => null,
                'category' => 'sign_ups',
                'tier' => 'alexandrite',
                'color' => '#4B0082',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'widget_data_cpa_realtime',
                    'user_column' => 'operator',
                    'user_id_mapping' => [
                        'type' => 'halo_id'
                    ],
                    'count_column' => 'total_sign_ups_current',
                    'date_column' => 'created_at',
                ]),
                'threshold' => 2000,
                'points' => 100000,
                'sort_order' => 9,
                'is_active' => true,
                'is_secret' => true,
            ],

            // Outbound Diallings - Tiered Badges
            [
                'slug' => 'outbound-diallings-bronze',
                'name' => 'Bronze Dialler',
                'description' => 'Made 1 Outbound Dialling',
                'image_url' => null,
                'category' => 'diallings',
                'tier' => 'bronze',
                'color' => '#CD7F32',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Dial'
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 1,
                'points' => 1,
                'sort_order' => 9,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'outbound-diallings-silver',
                'name' => 'Silver Dialler',
                'description' => 'Made 100 Outbound Diallings',
                'image_url' => null,
                'category' => 'diallings',
                'tier' => 'silver',
                'color' => '#C0C0C0',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Dial'
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 100,
                'points' => 100,
                'sort_order' => 10,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'outbound-diallings-gold',
                'name' => 'Gold Dialler',
                'description' => 'Made 1,000 Outbound Diallings',
                'image_url' => null,
                'category' => 'diallings',
                'tier' => 'gold',
                'color' => '#FFD700',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Dial'
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 1000,
                'points' => 1000,
                'sort_order' => 11,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'outbound-diallings-platinum',
                'name' => 'Platinum Dialler',
                'description' => 'Made 10,000 Outbound Diallings',
                'image_url' => null,
                'category' => 'diallings',
                'tier' => 'platinum',
                'color' => '#E5E4E2',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Dial'
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 5000,
                'points' => 5000,
                'sort_order' => 12,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'outbound-diallings-emerald',
                'name' => 'Emerald Dialler',
                'description' => 'Made 100,000 Outbound Diallings',
                'image_url' => null,
                'category' => 'diallings',
                'tier' => 'emerald',
                'color' => '#50C878',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Dial'
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 10000,
                'points' => 10000,
                'sort_order' => 13,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'outbound-diallings-ruby',
                'name' => 'Ruby Dialler',
                'description' => 'Made 250,000 Outbound Diallings',
                'image_url' => null,
                'category' => 'diallings',
                'tier' => 'ruby',
                'color' => '#E0115F',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Dial'
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 25000,
                'points' => 25000,
                'sort_order' => 15,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'outbound-diallings-sapphire',
                'name' => 'Sapphire Dialler',
                'description' => 'Made 500,000 Outbound Diallings',
                'image_url' => null,
                'category' => 'diallings',
                'tier' => 'sapphire',
                'color' => '#0F52BA',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Dial'
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 50000,
                'points' => 50000,
                'sort_order' => 16,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'outbound-diallings-diamond',
                'name' => 'Diamond Dialler',
                'description' => 'Made 750,000 Outbound Diallings',
                'image_url' => null,
                'category' => 'diallings',
                'tier' => 'diamond',
                'color' => '#B9F2FF',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Dial'
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 75000,
                'points' => 75000,
                'sort_order' => 17,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'outbound-diallings-alexandrite',
                'name' => 'Alexandrite Dialler',
                'description' => 'Made 1,000,000 Outbound Diallings',
                'image_url' => null,
                'category' => 'diallings',
                'tier' => 'alexandrite',
                'color' => '#4B0082',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Dial'
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 100000,
                'points' => 100000,
                'sort_order' => 18,
                'is_active' => true,
                'is_secret' => true,
            ],

            // Inbound Calls Handled - Tiered Badges
            [
                'slug' => 'inbound-calls-bronze',
                'name' => 'Bronze Call Handler',
                'description' => 'Handled 1 Inbound Call',
                'image_url' => null,
                'category' => 'inbound_calls',
                'tier' => 'bronze',
                'color' => '#CD7F32',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Queue',
                        'answered' => 1
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 1,
                'points' => 10,
                'sort_order' => 17,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'inbound-calls-silver',
                'name' => 'Silver Call Handler',
                'description' => 'Handled 50 Inbound Calls',
                'image_url' => null,
                'category' => 'inbound_calls',
                'tier' => 'silver',
                'color' => '#C0C0C0',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Queue',
                        'answered' => 1
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 50,
                'points' => 500,
                'sort_order' => 18,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'inbound-calls-gold',
                'name' => 'Gold Call Handler',
                'description' => 'Handled 100 Inbound Calls',
                'image_url' => null,
                'category' => 'inbound_calls',
                'tier' => 'gold',
                'color' => '#FFD700',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Queue',
                        'answered' => 1
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 100,
                'points' => 1000,
                'sort_order' => 19,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'inbound-calls-platinum',
                'name' => 'Platinum Call Handler',
                'description' => 'Handled 500 Inbound Calls',
                'image_url' => null,
                'category' => 'inbound_calls',
                'tier' => 'platinum',
                'color' => '#E5E4E2',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Queue',
                        'answered' => 1
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 500,
                'points' => 5000,
                'sort_order' => 20,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'inbound-calls-emerald',
                'name' => 'Emerald Call Handler',
                'description' => 'Handled 1,000 Inbound Calls',
                'image_url' => null,
                'category' => 'inbound_calls',
                'tier' => 'emerald',
                'color' => '#50C878',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Queue',
                        'answered' => 1
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 1000,
                'points' => 10000,
                'sort_order' => 21,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'inbound-calls-ruby',
                'name' => 'Ruby Call Handler',
                'description' => 'Handled 2,500 Inbound Calls',
                'image_url' => null,
                'category' => 'inbound_calls',
                'tier' => 'ruby',
                'color' => '#E0115F',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Queue',
                        'answered' => 1
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 2500,
                'points' => 25000,
                'sort_order' => 24,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'inbound-calls-sapphire',
                'name' => 'Sapphire Call Handler',
                'description' => 'Handled 5,000 Inbound Calls',
                'image_url' => null,
                'category' => 'inbound_calls',
                'tier' => 'sapphire',
                'color' => '#0F52BA',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Queue',
                        'answered' => 1
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 5000,
                'points' => 50000,
                'sort_order' => 25,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'inbound-calls-diamond',
                'name' => 'Diamond Call Handler',
                'description' => 'Handled 7,500 Inbound Calls',
                'image_url' => null,
                'category' => 'inbound_calls',
                'tier' => 'diamond',
                'color' => '#B9F2FF',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Queue',
                        'answered' => 1
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 7500,
                'points' => 75000,
                'sort_order' => 26,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'inbound-calls-alexandrite',
                'name' => 'Alexandrite Call Legend',
                'description' => 'Handled 10,000 Inbound Calls - A legendary achievement!',
                'image_url' => null,
                'category' => 'inbound_calls',
                'tier' => 'alexandrite',
                'color' => '#4B0082',
                'criteria_query' => json_encode([
                    'connection' => 'apex_data',
                    'table' => 'apex_data',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'date_time',
                    'where' => [
                        'type' => 'Queue',
                        'answered' => 1
                    ],
                    'where_not_in' => [
                        'type' => ['Spy', 'Int-In', 'Int-Out']
                    ]
                ]),
                'threshold' => 10000,
                'points' => 100000,
                'sort_order' => 27,
                'is_active' => true,
                'is_secret' => true,
            ],

            // Length of Service - Tiered Badges
            [
                'slug' => 'length-of-service-1-year',
                'name' => '1 Year of Service',
                'description' => 'Celebrated 1 year of service',
                'image_url' => null,
                'category' => 'service',
                'tier' => 'bronze',
                'color' => '#CD7F32',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'hr_details',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'calculation_type' => 'years_since',
                    'date_field' => 'start_date',
                ]),
                'threshold' => 1,
                'points' => 1000,
                'sort_order' => 25,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'length-of-service-2-years',
                'name' => '2 Years of Service',
                'description' => 'Celebrated 2 years of service',
                'image_url' => null,
                'category' => 'service',
                'tier' => 'silver',
                'color' => '#C0C0C0',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'hr_details',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'calculation_type' => 'years_since',
                    'date_field' => 'start_date',
                ]),
                'threshold' => 2,
                'points' => 5000,
                'sort_order' => 26,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'length-of-service-3-years',
                'name' => '3 Years of Service',
                'description' => 'Celebrated 3 years of service',
                'image_url' => null,
                'category' => 'service',
                'tier' => 'gold',
                'color' => '#FFD700',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'hr_details',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'calculation_type' => 'years_since',
                    'date_field' => 'start_date',
                ]),
                'threshold' => 3,
                'points' => 10000,
                'sort_order' => 27,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'length-of-service-4-years',
                'name' => '4 Years of Service',
                'description' => 'Celebrated 4 years of service',
                'image_url' => null,
                'category' => 'service',
                'tier' => 'platinum',
                'color' => '#E5E4E2',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'hr_details',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'calculation_type' => 'years_since',
                    'date_field' => 'start_date',
                ]),
                'threshold' => 4,
                'points' => 20000,
                'sort_order' => 28,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'length-of-service-5-years',
                'name' => '5 Years of Service',
                'description' => 'Celebrated 5 years of service',
                'image_url' => null,
                'category' => 'service',
                'tier' => 'emerald',
                'color' => '#50C878',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'hr_details',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'calculation_type' => 'years_since',
                    'date_field' => 'start_date',
                ]),
                'threshold' => 5,
                'points' => 30000,
                'sort_order' => 29,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'length-of-service-10-years',
                'name' => '10 Years of Service',
                'description' => 'Celebrated 10 years of service',
                'image_url' => null,
                'category' => 'service',
                'tier' => 'ruby',
                'color' => '#E0115F',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'hr_details',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'calculation_type' => 'years_since',
                    'date_field' => 'start_date',
                ]),
                'threshold' => 10,
                'points' => 50000,
                'sort_order' => 33,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'length-of-service-15-years',
                'name' => '15 Years of Service',
                'description' => 'Celebrated 15 years of service',
                'image_url' => null,
                'category' => 'service',
                'tier' => 'sapphire',
                'color' => '#0F52BA',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'hr_details',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'calculation_type' => 'years_since',
                    'date_field' => 'start_date',
                ]),
                'threshold' => 15,
                'points' => 75000,
                'sort_order' => 34,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'length-of-service-20-years',
                'name' => '20 Years of Service',
                'description' => 'Celebrated 20 years of service',
                'image_url' => null,
                'category' => 'service',
                'tier' => 'diamond',
                'color' => '#B9F2FF',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'hr_details',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'calculation_type' => 'years_since',
                    'date_field' => 'start_date',
                ]),
                'threshold' => 20,
                'points' => 100000,
                'sort_order' => 35,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'length-of-service-25-years',
                'name' => '25 Years of Service',
                'description' => 'Celebrated 25 years of service.',
                'image_url' => null,
                'category' => 'service',
                'tier' => 'alexandrite',
                'color' => '#4B0082',
                'criteria_query' => json_encode([
                    'connection' => 'wings_data',
                    'table' => 'hr_details',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'calculation_type' => 'years_since',
                    'date_field' => 'start_date',
                ]),
                'threshold' => 25,
                'points' => 125000,
                'sort_order' => 36,
                'is_active' => true,
                'is_secret' => false,
            ],

            // Shifts Attended - Tiered Badges
            [
                'slug' => 'shifts-attended-bronze',
                'name' => '1 Shift Completed',
                'description' => 'Completed your first shift',
                'image_url' => null,
                'category' => 'attendance',
                'tier' => 'bronze',
                'color' => '#CD7F32',
                'criteria_query' => json_encode([
                    'connection' => 'halo_rota',
                    'table' => 'shifts3',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'shift_date',
                    'where' => [
                        'completed' => 'y'
                    ]
                ]),
                'threshold' => 1,
                'points' => 100,
                'sort_order' => 33,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'shifts-attended-silver',
                'name' => '10 Shifts Completed',
                'description' => 'Completed 10 shifts',
                'image_url' => null,
                'category' => 'attendance',
                'tier' => 'silver',
                'color' => '#C0C0C0',
                'criteria_query' => json_encode([
                    'connection' => 'halo_rota',
                    'table' => 'shifts3',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'shift_date',
                    'where' => [
                        'completed' => 'y'
                    ]
                ]),
                'threshold' => 10,
                'points' => 1000,
                'sort_order' => 34,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'shifts-attended-gold',
                'name' => '25 Shifts Completed',
                'description' => 'Completed 25 shifts',
                'image_url' => null,
                'category' => 'attendance',
                'tier' => 'gold',
                'color' => '#FFD700',
                'criteria_query' => json_encode([
                    'connection' => 'halo_rota',
                    'table' => 'shifts3',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'shift_date',
                    'where' => [
                        'completed' => 'y'
                    ]
                ]),
                'threshold' => 25,
                'points' => 2500,
                'sort_order' => 35,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'shifts-attended-platinum',
                'name' => '50 Shifts Completed',
                'description' => 'Completed 50 shifts',
                'image_url' => null,
                'category' => 'attendance',
                'tier' => 'platinum',
                'color' => '#E5E4E2',
                'criteria_query' => json_encode([
                    'connection' => 'halo_rota',
                    'table' => 'shifts3',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'shift_date',
                    'where' => [
                        'completed' => 'y'
                    ]
                ]),
                'threshold' => 50,
                'points' => 5000,
                'sort_order' => 36,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'shifts-attended-emerald',
                'name' => '100 Shifts Completed',
                'description' => 'Completed 100 shifts',
                'image_url' => null,
                'category' => 'attendance',
                'tier' => 'emerald',
                'color' => '#50C878',
                'criteria_query' => json_encode([
                    'connection' => 'halo_rota',
                    'table' => 'shifts3',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'shift_date',
                    'where' => [
                        'completed' => 'y'
                    ]
                ]),
                'threshold' => 100,
                'points' => 10000,
                'sort_order' => 37,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'shifts-attended-ruby',
                'name' => '250 Shifts Completed',
                'description' => 'Completed 250 shifts',
                'image_url' => null,
                'category' => 'attendance',
                'tier' => 'ruby',
                'color' => '#E0115F',
                'criteria_query' => json_encode([
                    'connection' => 'halo_rota',
                    'table' => 'shifts3',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'shift_date',
                    'where' => [
                        'completed' => 'y'
                    ]
                ]),
                'threshold' => 250,
                'points' => 25000,
                'sort_order' => 42,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'shifts-attended-sapphire',
                'name' => '500 Shifts Completed',
                'description' => 'Completed 500 shifts',
                'image_url' => null,
                'category' => 'attendance',
                'tier' => 'sapphire',
                'color' => '#0F52BA',
                'criteria_query' => json_encode([
                    'connection' => 'halo_rota',
                    'table' => 'shifts3',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'shift_date',
                    'where' => [
                        'completed' => 'y'
                    ]
                ]),
                'threshold' => 500,
                'points' => 50000,
                'sort_order' => 43,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'shifts-attended-diamond',
                'name' => '750 Shifts Completed',
                'description' => 'Completed 750 shifts',
                'image_url' => null,
                'category' => 'attendance',
                'tier' => 'diamond',
                'color' => '#B9F2FF',
                'criteria_query' => json_encode([
                    'connection' => 'halo_rota',
                    'table' => 'shifts3',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'shift_date',
                    'where' => [
                        'completed' => 'y'
                    ]
                ]),
                'threshold' => 750,
                'points' => 75000,
                'sort_order' => 44,
                'is_active' => true,
                'is_secret' => false,
            ],
            [
                'slug' => 'shifts-attended-alexandrite',
                'name' => '1000 Shifts Completed',
                'description' => 'Completed 1,000 shifts',
                'image_url' => null,
                'category' => 'attendance',
                'tier' => 'alexandrite',
                'color' => '#4B0082',
                'criteria_query' => json_encode([
                    'connection' => 'halo_rota',
                    'table' => 'shifts3',
                    'user_column' => 'hr_id',
                    'user_id_mapping' => [
                        'type' => 'hr_id'
                    ],
                    'count_column' => 'unq_id',
                    'date_column' => 'shift_date',
                    'where' => [
                        'completed' => 'y'
                    ]
                ]),
                'threshold' => 1000,
                'points' => 100000,
                'sort_order' => 45,
                'is_active' => true,
                'is_secret' => true,
            ],
        ];

        // Insert all badges
        foreach ($badges as $badge) {
            DB::connection('pulse')->table('badges')->insert(array_merge($badge, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Now set up prerequisites (tier progression)
        $prerequisiteMap = [
            // Sign Ups progression
            'acquired-sign-ups-silver' => 'acquired-sign-ups-bronze',
            'acquired-sign-ups-gold' => 'acquired-sign-ups-silver',
            'acquired-sign-ups-platinum' => 'acquired-sign-ups-gold',
            'acquired-sign-ups-emerald' => 'acquired-sign-ups-platinum',
            'acquired-sign-ups-ruby' => 'acquired-sign-ups-emerald',
            'acquired-sign-ups-sapphire' => 'acquired-sign-ups-ruby',
            'acquired-sign-ups-diamond' => 'acquired-sign-ups-sapphire',
            'acquired-sign-ups-alexandrite' => 'acquired-sign-ups-diamond',

            // Outbound Diallings progression
            'outbound-diallings-silver' => 'outbound-diallings-bronze',
            'outbound-diallings-gold' => 'outbound-diallings-silver',
            'outbound-diallings-platinum' => 'outbound-diallings-gold',
            'outbound-diallings-emerald' => 'outbound-diallings-platinum',
            'outbound-diallings-ruby' => 'outbound-diallings-emerald',
            'outbound-diallings-sapphire' => 'outbound-diallings-ruby',
            'outbound-diallings-diamond' => 'outbound-diallings-sapphire',
            'outbound-diallings-alexandrite' => 'outbound-diallings-diamond',

            // Inbound Calls progression
            'inbound-calls-silver' => 'inbound-calls-bronze',
            'inbound-calls-gold' => 'inbound-calls-silver',
            'inbound-calls-platinum' => 'inbound-calls-gold',
            'inbound-calls-emerald' => 'inbound-calls-platinum',
            'inbound-calls-ruby' => 'inbound-calls-emerald',
            'inbound-calls-sapphire' => 'inbound-calls-ruby',
            'inbound-calls-diamond' => 'inbound-calls-sapphire',
            'inbound-calls-alexandrite' => 'inbound-calls-diamond',

            // Length of Service progression
            'length-of-service-2-years' => 'length-of-service-1-year',
            'length-of-service-3-years' => 'length-of-service-2-years',
            'length-of-service-4-years' => 'length-of-service-3-years',
            'length-of-service-5-years' => 'length-of-service-4-years',
            'length-of-service-10-years' => 'length-of-service-5-years',
            'length-of-service-15-years' => 'length-of-service-10-years',
            'length-of-service-20-years' => 'length-of-service-15-years',
            'length-of-service-25-years' => 'length-of-service-20-years',

            // Shifts Attended progression
            'shifts-attended-silver' => 'shifts-attended-bronze',
            'shifts-attended-gold' => 'shifts-attended-silver',
            'shifts-attended-platinum' => 'shifts-attended-gold',
            'shifts-attended-emerald' => 'shifts-attended-platinum',
            'shifts-attended-ruby' => 'shifts-attended-emerald',
            'shifts-attended-sapphire' => 'shifts-attended-ruby',
            'shifts-attended-diamond' => 'shifts-attended-sapphire',
            'shifts-attended-alexandrite' => 'shifts-attended-diamond',
        ];

        foreach ($prerequisiteMap as $badgeSlug => $prerequisiteSlug) {
            $badge = DB::connection('pulse')->table('badges')->where('slug', $badgeSlug)->first();
            $prerequisite = DB::connection('pulse')->table('badges')->where('slug', $prerequisiteSlug)->first();

            if ($badge && $prerequisite) {
                DB::connection('pulse')->table('badges')
                    ->where('id', $badge->id)
                    ->update(['prerequisite_badge_id' => $prerequisite->id]);
            }
        }

        // Award all badges to user_id 1 for testing
        $allBadges = DB::connection('pulse')->table('badges')->get();
        
        foreach ($allBadges as $badge) {
            // Award the badge
            DB::connection('pulse')->table('user_badges')->insert([
                'user_id' => 1,
                'badge_id' => $badge->id,
                'awarded_at' => now(),
                'progress_value' => $badge->threshold,
                'rank' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Set progress to 100%
            DB::connection('pulse')->table('user_badge_progress')->insert([
                'user_id' => 1,
                'badge_id' => $badge->id,
                'current_count' => $badge->threshold,
                'percentage' => 100.00,
                'started_at' => now(),
                'last_checked_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Update user stats for user_id 1
        $totalBadges = $allBadges->count();
        $totalPoints = $allBadges->sum('points');
        
        // Get appropriate tier based on total points
        $currentTier = DB::connection('pulse')->table('badge_tiers')
            ->where('min_points', '<=', $totalPoints)
            ->orderBy('min_points', 'desc')
            ->first();

        DB::connection('pulse')->table('user_badge_stats')->insert([
            'user_id' => 1,
            'total_badges' => $totalBadges,
            'total_points' => $totalPoints,
            'current_tier_id' => $currentTier->id ?? null,
            'highest_tier_reached_id' => $currentTier->id ?? null,
            'badges_refreshed_at' => now(),
            'last_badge_earned_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

