export interface IpInfoDB {
    ip: string; // IP地址
    continentCode?: string; // 大陆代码
    continentName?: string; // 大陆名称
    countryCode2?: string; // 国家代码（2位）
    countryCode3?: string; // 国家代码（3位）
    countryName?: string; // 国家名称
    countryNameOfficial?: string; // 国家官方名称
    countryCapital?: string; // 国家首都
    stateProv?: string; // 省或州
    stateCode?: string; // 省或州代码
    district?: string; // 区
    city?: string; // 城市
    zipcode?: string; // 邮政编码
    latitude?: number; // 纬度
    longitude?: number; // 经度
    isEu?: boolean; // 是否属于欧盟
    callingCode?: string; // 国际电话区号
    countryTld?: string; // 国家顶级域名
    languages?: string; // 使用语言
    countryFlag?: string; // 国家国旗URL
    geonameId?: number; // GeoName ID
    isp?: string; // 互联网服务提供商
    connectionType?: string; // 连接类型
    organization?: string; // 组织名称
    countryEmoji?: string; // 国家表情符号
    currencyCode?: string; // 货币代码
    currencyName?: string; // 货币名称
    currencySymbol?: string; // 货币符号
    timeZoneName?: string; // 时区名称
    timeZoneOffset?: number; // 时区偏移量
    timeZoneOffsetWithDst?: number; // 含夏令时的时区偏移量
    timeZoneCurrentTime?: string; // 当前时间
    timeZoneCurrentTimeUnix?: number; // 当前时间的Unix时间戳
    timeZoneIsDst?: boolean; // 是否为夏令时
    timeZoneDstSavings?: number; // 夏令时的节约时间
    timeZoneDstExists?: boolean; // 是否存在夏令时
    timeZoneDstStart?: string; // 夏令时开始时间
    timeZoneDstEnd?: string; // 夏令时结束时间
}

export interface IpInfoVO {
    city?: string; // 城市
    countryName?: string; // 国家名称
    countryCode2?: string; // 国家代码（2位）
    countryFlag?: string; // 国旗url
}

export interface PhotoIpDbInsert extends IpInfoDB{
}

