import {project} from '../edge-functions/kokmatch-board/board.mjs';

export async function boardFixture(routeTarget,state,identity={}){
  await routeTarget.route('**/functions/v1/kokmatch-board',async route=>{
    const s=await state();
    if(route.request().postDataJSON()?.action!=='read')throw Error('Unexpected write to read-only board fixture');
    const board=project(s);
    await route.fulfill({json:{board,stamp:JSON.stringify(board),serverNow:Date.now(),edit:!!(identity.globalAdmin||identity.tempOrganizer||['manager','organizer'].includes(identity.role)),finish:true,undo:false}});
  });
}
