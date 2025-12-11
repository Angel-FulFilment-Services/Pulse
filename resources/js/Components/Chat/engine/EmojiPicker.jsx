import React, { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'

// All available reactions grouped by category (same as MessageReactions)
const ALL_REACTIONS = {
  'Smileys & Emotion': [
    { emoji: '😀', name: 'grinning_face', label: 'Grinning' },
    { emoji: '😃', name: 'grinning_face_with_big_eyes', label: 'Grinning Big Eyes' },
    { emoji: '😄', name: 'grinning_face_with_smiling_eyes', label: 'Grinning Smiling Eyes' },
    { emoji: '😁', name: 'beaming_face_with_smiling_eyes', label: 'Beaming' },
    { emoji: '😆', name: 'grinning_squinting_face', label: 'Grinning Squinting' },
    { emoji: '😅', name: 'grinning_face_with_sweat', label: 'Grinning Sweat' },
    { emoji: '🤣', name: 'rolling_on_the_floor_laughing', label: 'ROFL' },
    { emoji: '😂', name: 'face_with_tears_of_joy', label: 'Tears of Joy' },
    { emoji: '🙂', name: 'slightly_smiling_face', label: 'Slightly Smiling' },
    { emoji: '🙃', name: 'upside_down_face', label: 'Upside Down' },
    { emoji: '😉', name: 'winking_face', label: 'Winking' },
    { emoji: '😊', name: 'smiling_face_with_smiling_eyes', label: 'Smiling Eyes' },
    { emoji: '😇', name: 'smiling_face_with_halo', label: 'Halo' },
    { emoji: '🥰', name: 'smiling_face_with_hearts', label: 'Hearts' },
    { emoji: '😍', name: 'smiling_face_with_heart_eyes', label: 'Heart Eyes' },
    { emoji: '🤩', name: 'star_struck', label: 'Star Struck' },
    { emoji: '😘', name: 'face_blowing_a_kiss', label: 'Blowing Kiss' },
    { emoji: '😗', name: 'kissing_face', label: 'Kissing' },
    { emoji: '😚', name: 'kissing_face_with_closed_eyes', label: 'Kissing Closed Eyes' },
    { emoji: '😙', name: 'kissing_face_with_smiling_eyes', label: 'Kissing Smiling Eyes' },
    { emoji: '😋', name: 'face_savoring_food', label: 'Savoring Food' },
    { emoji: '😛', name: 'face_with_tongue', label: 'Tongue' },
    { emoji: '😜', name: 'winking_face_with_tongue', label: 'Winking Tongue' },
    { emoji: '🤪', name: 'zany_face', label: 'Zany' },
    { emoji: '😝', name: 'squinting_face_with_tongue', label: 'Squinting Tongue' },
    { emoji: '🤑', name: 'money_mouth_face', label: 'Money Mouth' },
    { emoji: '🤗', name: 'hugging_face', label: 'Hugging' },
    { emoji: '🤭', name: 'face_with_hand_over_mouth', label: 'Hand Over Mouth' },
    { emoji: '🤫', name: 'shushing_face', label: 'Shushing' },
    { emoji: '🤔', name: 'thinking_face', label: 'Thinking' },
    { emoji: '🤐', name: 'zipper_mouth_face', label: 'Zipper Mouth' },
    { emoji: '🤨', name: 'face_with_raised_eyebrow', label: 'Raised Eyebrow' },
    { emoji: '😐', name: 'neutral_face', label: 'Neutral' },
    { emoji: '😑', name: 'expressionless_face', label: 'Expressionless' },
    { emoji: '😶', name: 'face_without_mouth', label: 'No Mouth' },
    { emoji: '😏', name: 'smirking_face', label: 'Smirking' },
    { emoji: '😒', name: 'unamused_face', label: 'Unamused' },
    { emoji: '🙄', name: 'face_with_rolling_eyes', label: 'Rolling Eyes' },
    { emoji: '😬', name: 'grimacing_face', label: 'Grimacing' },
    { emoji: '🤥', name: 'lying_face', label: 'Lying' },
    { emoji: '😌', name: 'relieved_face', label: 'Relieved' },
    { emoji: '😔', name: 'pensive_face', label: 'Pensive' },
    { emoji: '😪', name: 'sleepy_face', label: 'Sleepy' },
    { emoji: '🤤', name: 'drooling_face', label: 'Drooling' },
    { emoji: '😴', name: 'sleeping_face', label: 'Sleeping' },
    { emoji: '😷', name: 'face_with_medical_mask', label: 'Medical Mask' },
    { emoji: '🤒', name: 'face_with_thermometer', label: 'Thermometer' },
    { emoji: '🤕', name: 'face_with_head_bandage', label: 'Bandage' },
    { emoji: '🤢', name: 'nauseated_face', label: 'Nauseated' },
    { emoji: '🤮', name: 'face_vomiting', label: 'Vomiting' },
    { emoji: '🤧', name: 'sneezing_face', label: 'Sneezing' },
    { emoji: '🥵', name: 'hot_face', label: 'Hot' },
    { emoji: '🥶', name: 'cold_face', label: 'Cold' },
    { emoji: '😵', name: 'dizzy_face', label: 'Dizzy' },
    { emoji: '🤯', name: 'exploding_head', label: 'Exploding Head' },
    { emoji: '😕', name: 'confused_face', label: 'Confused' },
    { emoji: '😟', name: 'worried_face', label: 'Worried' },
    { emoji: '🙁', name: 'slightly_frowning_face', label: 'Slightly Frowning' },
    { emoji: '☹️', name: 'frowning_face', label: 'Frowning' },
    { emoji: '😮', name: 'face_with_open_mouth', label: 'Open Mouth' },
    { emoji: '😯', name: 'hushed_face', label: 'Hushed' },
    { emoji: '😲', name: 'astonished_face', label: 'Astonished' },
    { emoji: '😳', name: 'flushed_face', label: 'Flushed' },
    { emoji: '🥺', name: 'pleading_face', label: 'Pleading' },
    { emoji: '😦', name: 'frowning_face_with_open_mouth', label: 'Frowning Open Mouth' },
    { emoji: '😧', name: 'anguished_face', label: 'Anguished' },
    { emoji: '😨', name: 'fearful_face', label: 'Fearful' },
    { emoji: '😰', name: 'anxious_face_with_sweat', label: 'Anxious Sweat' },
    { emoji: '😥', name: 'sad_but_relieved_face', label: 'Sad Relieved' },
    { emoji: '😢', name: 'crying_face', label: 'Crying' },
    { emoji: '😭', name: 'loudly_crying_face', label: 'Loudly Crying' },
    { emoji: '😱', name: 'face_screaming_in_fear', label: 'Screaming' },
    { emoji: '😖', name: 'confounded_face', label: 'Confounded' },
    { emoji: '😣', name: 'persevering_face', label: 'Persevering' },
    { emoji: '😞', name: 'disappointed_face', label: 'Disappointed' },
    { emoji: '😓', name: 'downcast_face_with_sweat', label: 'Downcast Sweat' },
    { emoji: '😩', name: 'weary_face', label: 'Weary' },
    { emoji: '😫', name: 'tired_face', label: 'Tired' },
    { emoji: '🥱', name: 'yawning_face', label: 'Yawning' },
    { emoji: '😤', name: 'face_with_steam_from_nose', label: 'Steam Nose' },
    { emoji: '😡', name: 'pouting_face', label: 'Pouting' },
    { emoji: '😠', name: 'angry_face', label: 'Angry' },
    { emoji: '🤬', name: 'face_with_symbols_on_mouth', label: 'Symbols Mouth' },
    { emoji: '😈', name: 'smiling_face_with_horns', label: 'Smiling Horns' },
    { emoji: '👿', name: 'angry_face_with_horns', label: 'Angry Horns' },
    { emoji: '💀', name: 'skull', label: 'Skull' },
    { emoji: '☠️', name: 'skull_and_crossbones', label: 'Skull Crossbones' },
    { emoji: '💩', name: 'pile_of_poo', label: 'Poop' },
    { emoji: '🤡', name: 'clown_face', label: 'Clown' },
    { emoji: '👹', name: 'ogre', label: 'Ogre' },
    { emoji: '👺', name: 'goblin', label: 'Goblin' },
    { emoji: '👻', name: 'ghost', label: 'Ghost' },
    { emoji: '👽', name: 'alien', label: 'Alien' },
    { emoji: '👾', name: 'alien_monster', label: 'Alien Monster' },
    { emoji: '🤖', name: 'robot', label: 'Robot' },
    { emoji: '😺', name: 'grinning_cat', label: 'Grinning Cat' },
    { emoji: '😸', name: 'grinning_cat_with_smiling_eyes', label: 'Grinning Cat Eyes' },
    { emoji: '😹', name: 'cat_with_tears_of_joy', label: 'Cat Tears Joy' },
    { emoji: '😻', name: 'smiling_cat_with_heart_eyes', label: 'Cat Heart Eyes' },
    { emoji: '😼', name: 'cat_with_wry_smile', label: 'Cat Wry Smile' },
    { emoji: '😽', name: 'kissing_cat', label: 'Kissing Cat' },
    { emoji: '🙀', name: 'weary_cat', label: 'Weary Cat' },
    { emoji: '😿', name: 'crying_cat', label: 'Crying Cat' },
    { emoji: '😾', name: 'pouting_cat', label: 'Pouting Cat' },
    { emoji: '❤️', name: 'red_heart', label: 'Red Heart' },
    { emoji: '🧡', name: 'orange_heart', label: 'Orange Heart' },
    { emoji: '💛', name: 'yellow_heart', label: 'Yellow Heart' },
    { emoji: '💚', name: 'green_heart', label: 'Green Heart' },
    { emoji: '💙', name: 'blue_heart', label: 'Blue Heart' },
    { emoji: '💜', name: 'purple_heart', label: 'Purple Heart' },
    { emoji: '🖤', name: 'black_heart', label: 'Black Heart' },
    { emoji: '🤍', name: 'white_heart', label: 'White Heart' },
    { emoji: '🤎', name: 'brown_heart', label: 'Brown Heart' },
    { emoji: '💔', name: 'broken_heart', label: 'Broken Heart' },
    { emoji: '❣️', name: 'heart_exclamation', label: 'Heart Exclamation' },
    { emoji: '💕', name: 'two_hearts', label: 'Two Hearts' },
    { emoji: '💞', name: 'revolving_hearts', label: 'Revolving Hearts' },
    { emoji: '💓', name: 'beating_heart', label: 'Beating Heart' },
    { emoji: '💗', name: 'growing_heart', label: 'Growing Heart' },
    { emoji: '💖', name: 'sparkling_heart', label: 'Sparkling Heart' },
    { emoji: '💘', name: 'heart_with_arrow', label: 'Heart Arrow' },
    { emoji: '💝', name: 'heart_with_ribbon', label: 'Heart Ribbon' },
  ],
  'Gestures & People': [
    { emoji: '👋', name: 'waving_hand', label: 'Waving Hand' },
    { emoji: '🤚', name: 'raised_back_of_hand', label: 'Raised Back' },
    { emoji: '🖐️', name: 'hand_with_fingers_splayed', label: 'Hand Splayed' },
    { emoji: '✋', name: 'raised_hand', label: 'Raised Hand' },
    { emoji: '🖖', name: 'vulcan_salute', label: 'Vulcan Salute' },
    { emoji: '👌', name: 'ok_hand', label: 'OK Hand' },
    { emoji: '🤏', name: 'pinching_hand', label: 'Pinching' },
    { emoji: '✌️', name: 'victory_hand', label: 'Victory' },
    { emoji: '🤞', name: 'crossed_fingers', label: 'Crossed Fingers' },
    { emoji: '🤟', name: 'love_you_gesture', label: 'Love You' },
    { emoji: '🤘', name: 'sign_of_the_horns', label: 'Horns' },
    { emoji: '🤙', name: 'call_me_hand', label: 'Call Me' },
    { emoji: '👈', name: 'backhand_index_pointing_left', label: 'Point Left' },
    { emoji: '👉', name: 'backhand_index_pointing_right', label: 'Point Right' },
    { emoji: '👆', name: 'backhand_index_pointing_up', label: 'Point Up' },
    { emoji: '🖕', name: 'middle_finger', label: 'Middle Finger' },
    { emoji: '👇', name: 'backhand_index_pointing_down', label: 'Point Down' },
    { emoji: '☝️', name: 'index_pointing_up', label: 'Index Up' },
    { emoji: '👍', name: 'thumbs_up', label: 'Thumbs Up' },
    { emoji: '👎', name: 'thumbs_down', label: 'Thumbs Down' },
    { emoji: '✊', name: 'raised_fist', label: 'Raised Fist' },
    { emoji: '👊', name: 'oncoming_fist', label: 'Fist Bump' },
    { emoji: '🤛', name: 'left_facing_fist', label: 'Left Fist' },
    { emoji: '🤜', name: 'right_facing_fist', label: 'Right Fist' },
    { emoji: '👏', name: 'clapping_hands', label: 'Clapping' },
    { emoji: '🙌', name: 'raising_hands', label: 'Raising Hands' },
    { emoji: '👐', name: 'open_hands', label: 'Open Hands' },
    { emoji: '🤲', name: 'palms_up_together', label: 'Palms Up' },
    { emoji: '🤝', name: 'handshake', label: 'Handshake' },
    { emoji: '🙏', name: 'folded_hands', label: 'Folded Hands' },
    { emoji: '✍️', name: 'writing_hand', label: 'Writing' },
    { emoji: '💪', name: 'flexed_biceps', label: 'Muscle' },
  ],
  'Objects': [
    { emoji: '💻', name: 'laptop', label: 'Laptop' },
    { emoji: '⌨️', name: 'keyboard', label: 'Keyboard' },
    { emoji: '🖥️', name: 'desktop_computer', label: 'Desktop' },
    { emoji: '🖨️', name: 'printer', label: 'Printer' },
    { emoji: '🖱️', name: 'computer_mouse', label: 'Mouse' },
    { emoji: '📱', name: 'mobile_phone', label: 'Phone' },
    { emoji: '☎️', name: 'telephone', label: 'Telephone' },
    { emoji: '📞', name: 'telephone_receiver', label: 'Receiver' },
    { emoji: '📟', name: 'pager', label: 'Pager' },
    { emoji: '📠', name: 'fax_machine', label: 'Fax' },
    { emoji: '🔋', name: 'battery', label: 'Battery' },
    { emoji: '🔌', name: 'electric_plug', label: 'Plug' },
    { emoji: '💡', name: 'light_bulb', label: 'Bulb' },
    { emoji: '🔦', name: 'flashlight', label: 'Flashlight' },
    { emoji: '🕯️', name: 'candle', label: 'Candle' },
    { emoji: '🗑️', name: 'wastebasket', label: 'Trash' },
    { emoji: '🛠️', name: 'hammer_and_wrench', label: 'Tools' },
    { emoji: '🔨', name: 'hammer', label: 'Hammer' },
    { emoji: '⚒️', name: 'hammer_and_pick', label: 'Hammer Pick' },
    { emoji: '🛠️', name: 'tools', label: 'Tools' },
    { emoji: '⚙️', name: 'gear', label: 'Gear' },
    { emoji: '🔧', name: 'wrench', label: 'Wrench' },
    { emoji: '🔩', name: 'nut_and_bolt', label: 'Bolt' },
    { emoji: '⚖️', name: 'balance_scale', label: 'Scale' },
    { emoji: '🔗', name: 'link', label: 'Link' },
    { emoji: '⛓️', name: 'chains', label: 'Chains' },
    { emoji: '🧰', name: 'toolbox', label: 'Toolbox' },
    { emoji: '🧲', name: 'magnet', label: 'Magnet' },
  ]
}

export default function EmojiPicker({ onSelectEmoji, buttonRef }) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const { refs, floatingStyles, strategy, x, y } = useFloating({
    placement: 'top-start',
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
    elements: {
      reference: buttonRef?.current
    }
  })

  // Filter reactions based on search
  const filteredReactions = searchTerm.trim() === '' 
    ? ALL_REACTIONS 
    : Object.entries(ALL_REACTIONS).reduce((acc, [category, reactions]) => {
        const filtered = reactions.filter(r => 
          r.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.emoji.includes(searchTerm)
        )
        if (filtered.length > 0) {
          acc[category] = filtered
        }
        return acc
      }, {})

  const handleEmojiClick = (emoji) => {
    onSelectEmoji(emoji.emoji)
    setSearchTerm('')
  }

  return (
    <div
      ref={refs.setFloating}
      style={{
        position: strategy,
        top: y ?? 0,
        left: x ?? 0,
        zIndex: 50,
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-80">
        {/* Search bar */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Find something fun"
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Reactions grid */}
        <div className="max-h-80 overflow-y-auto p-3">
          {Object.keys(filteredReactions).length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No emojis found
            </div>
          ) : (
            Object.entries(filteredReactions).map(([category, reactions]) => (
              <div key={category} className="mb-4 last:mb-0">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  {category}
                </h3>
                <div className="grid grid-cols-8 gap-1">
                  {reactions.map((reaction) => (
                    <button
                      key={reaction.name}
                      onClick={() => handleEmojiClick(reaction)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-xl"
                      title={reaction.label}
                    >
                      {reaction.emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
