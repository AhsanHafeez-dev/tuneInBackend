// const rawUser = await prisma.user.findFirst({
//   where: { id: req.user?.id },
//   include: {
//     watchHistory: {
//       include: { video: { include: { owner: true } } },
//       orderBy: { watchedAt: "desc" },
//     },
//   },
// });

// const formattedWatchHistory = rawUser.watchHistory.map((historyItem) => ({
//   id: historyItem.videoId,
//   title: historyItem.video.title,
//   thumbnail: historyItem.video.thumbnail,
//   views: historyItem.video.views,
//   duration: historyItem.video.duration,
//   description: historyItem.video.description,
//   owner: {
//     userName: historyItem.video.owner.userName,
//     avatar: historyItem.video.owner.avatar,
//   },
//   watchedAt: historyItem.watchedAt,
//   progress: historyItem.watchedTill,
// }));

// rawUser.watchHistory = formattedWatchHistory;

// let s = "abc";
// if (!(s instanceof Array)) {
//   s = [s];
//   console.log(s);
// }

// {
//   "version": 2,
//   "rewrites": [
//     { "source": "/(.*)", "destination": "/api/index.js" }
//   ]
// }

const seconds = [55,
  (21 * 60) + 52
];

seconds.map((sec) => {
  console.log("converting ", sec);
  console.log(`Hours : ${Math.floor(sec/(60*60))}   minutes :${   Math.floor(  ((sec)%(60*60))/60   )  }  Seconds  ${sec %60} `);
  
  
})
