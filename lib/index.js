// 实现这个项目的构建任务

const { src, dest, parallel, series ,watch} = require("gulp");
const loadPlugins = require("gulp-load-plugins");
const sass = require('gulp-sass')(require('sass'));
const imageMin=require("gulp-imagemin")
const cwd=process.cwd()
// 加载常引用插件 sass babel imagemin swig等
const plugins = loadPlugins()
let config={
    build:{
        src:"src",
        tmp:"tmp",
        dist:"dist",
        styles:"assets/styles/*.scss",
        page:"*.html",
        fonts:"assets/fonts/**",
        images:"assets/images/**",
        scripts:"assets/scripts/*.js",
        public:"public"
    }
}

try{
    let loadCobnfig=require(`${cwd}/page.config.js`);
    config=Object.assign({},config,loadCobnfig)
}catch(e){};



// 删除文件插件
const del = require("del")

// 服务插件
const BrowserSync = require("browser-sync");

// 创建服务
const bs = BrowserSync.create();

// 样式编译

const style = () => {

    // 编译src目录下的所有scss文件,输出dist文件夹下
    // base 参数 是设置基准目录 打包后的目录生成也是按照如此生成的
    return src(config.build.styles, { base: config.build.src,cwd:config.build.src })
        .pipe(sass())
        .pipe(dest(config.build.tmp))
        .pipe(bs.reload({stream:true}))


}

// js编译
const script = () => {
    return src(config.build.scripts, { base: config.build.src,cwd:config.build.src })
        .pipe(plugins.babel({ presets: [require("@babel/preset-env")] }))
        .pipe(dest(config.build.tmp))
        .pipe(bs.reload({stream:true}))
}

// html编译

const page = () => {
    return src(config.build.page, {base: config.build.src,cwd:config.build.src })
        .pipe(plugins.swig(
            {
                data:config,
                caches:false
            }
        ))
        .pipe(dest(config.build.tmp))
        .pipe(bs.reload({stream:true}))

}

// 图片编译
const image = () => {
    return src(config.build.images, {base: config.build.src,cwd:config.build.src })
        .pipe(imageMin())
        .pipe(dest(config.build.dist))
        
}
// 字体文件编译
const font = () => {
    return src(config.build.fonts, {base: config.build.src,cwd:config.build.src })
        .pipe(imageMin())
        .pipe(dest(config.build.dist))
}

// 其他文件
const extra = () => {
    return src("**", { base: config.build.public,cwd:config.build.public })
        .pipe(dest(config.build.dist))
}

// 清除文件
const clean = () => {
    return del([config.build.dist])
}

// 服务器支持
const serve = () => {
    // 热启动 监听文件变化然后更新
    watch(config.build.styles,{cwd:config.build.src},style);
    watch(config.build.scripts,{cwd:config.build.src},script);
    watch(config.build.page,{cwd:config.build.src},page);
    // 其他文件发生变化后 直接重新load
    watch([
        config.build.images,
        config.build.fonts,
    ],{cwd:config.build.src},bs.reload)
    watch([
       "**"
    ],{cwd:config.build.public},bs.reload)
 
    bs.init(
        {
            port: 8080, //服务器端口设置
            notify: false,
            // open:false, 自动打开浏览器
            server: {
                baseDir: [config.build.tmp,config.build.src,config.build.public],
                routes: {
                    // 根据路由改变引用文件位置
                    "/node_modules": "node_modules"
                }
            }
        }
    )
}
// 提取node_modules 中引用的文件
const useref=()=>{
    return src(config.build.page, { base: config.build.tmp,cwd:config.build.tmp })
    .pipe(plugins.useref({searchPath:[config.build.tmp,"."]}))
    // html js css 压缩
    // .pipe(plugins.if(/\.js$/,plugins.uglify()))
    // .pipe(plugins.if(/\.css$/,plugins.cleanCss()))
    // .pipe(plugins.if(/\.html/,plugins.htmlmin(
    //     {
    //         minifyCss:true,
    //         collapseWhitespace:true,
    //         minifyJs:true,
    //     }
    // )))
    .pipe(dest(config.build.dist))
}


// 组合任务 同步  
// 开发调用的任务 一般不需要执行 图片 字体 等方法
const complie = parallel(style, script, page );

// 异步任务 
// 上线之前执行 build任务
const build = series(clean, parallel(series(complie,useref), extra,image, font))

// 

const develop=series(complie,serve)

module.exports = {
    complie,
    build,
    serve,
    dev:develop,
    useref
}