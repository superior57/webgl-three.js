
class Stage {

    constructor() {
        this.progress = 0

        this.$els = {
            title       : document.querySelector('.page-title'),
            progress    : document.querySelector('.slideshow__progress'),
            progressCtn : document.querySelector('.slideshow__progress-ctn'),
            scene       : document.getElementById('scene'),
        }
        this.init()
    }
    init() {
        this.scene = new Scene(this.$els.scene)
    }
}
