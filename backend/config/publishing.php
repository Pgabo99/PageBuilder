<?php

return [

    /*
    | A publikált webhelyek gyökérkönyvtára (a worker írja, az Nginx csak olvassa).
    */
    'path' => env('PUBLISH_PATH', storage_path('app/sites')),

    /*
    | Ennyi percig tekintünk egy queued/running állapotot folyamatban lévőnek;
    | ezután (pl. leállt worker esetén) újra lehet publikálni.
    */
    'stale_after_minutes' => 5,

];
