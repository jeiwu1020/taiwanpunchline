import test from 'node:test';
import assert from 'node:assert/strict';
import {newDocument} from '../dist/preview/campaign/core/model.mjs';
import {starterOpeningMode} from '../dist/starter-opening.mjs';
import {createMainCampaignBridge} from '../dist/main-campaign-bridge.mjs';
import {legacyProjection} from '../dist/preview/campaign/unified/schema.mjs';

function fixture() {
 const document=newDocument(),profile=document.profiles[0];
 const state={authority:'campaign',activeProfileId:'slot-1',persisted:false,initialized:false,document:{version:1,activeProfileId:'slot-1',profiles:document.profiles.map(legacyProjection)}};
 const progress={get:()=>structuredClone(state),readProfile:()=>structuredClone(profile)};
 return {profile,state,bridge:createMainCampaignBridge(progress)};
}

test('fresh campaign opening remains unseen after preparation without starting a run',()=>{
 const f=fixture();
 assert.equal(starterOpeningMode({profiles:f.bridge.openingProfiles,characterId:'wang'}),'new-run');
 f.profile.campaign.selection={characterId:'han',helperId:'wang'};
 f.state.initialized=true;f.state.persisted=true;
 assert.equal(starterOpeningMode({profiles:f.bridge.openingProfiles,characterId:'han'}),'new-run');
 assert.equal(f.profile.campaign.story.opening,'unseen');
});

test('fresh campaign uses explicit comic state, not an empty legacy projection heuristic',()=>{
 const f=fixture();
 f.profile.campaign.story.opening='seen';
 f.profile.campaign.cursor.stepId='route-a';
 assert.equal(starterOpeningMode({profiles:f.bridge.openingProfiles,characterId:'wang'}),'continue');
 assert.equal(starterOpeningMode({profiles:f.bridge.openingProfiles,characterId:'wang',review:true}),'review');
 f.profile.campaign.story.opening='unseen';
 assert.equal(starterOpeningMode({profiles:f.bridge.openingProfiles,characterId:'han',replay:true}),'continue');
});

test('other chapter and nonstarter characters never receive the starter wake-up accidentally',()=>{
 const f=fixture();
 f.profile.campaign.cursor={chapterId:'chapter-2',stepId:'entry'};
 assert.equal(starterOpeningMode({profiles:f.bridge.openingProfiles,characterId:'wang'}),'continue');
 assert.equal(starterOpeningMode({profiles:f.bridge.openingProfiles,characterId:'ma'}),'legacy');
});
